/**
 * @file src/common/middleware/secureUploads.ts
 * @description Secure static asset handler for /uploads preventing directory traversal,
 * unauthorized access to private student/user files, and directory enumeration.
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/config/database';
import { zoneService } from '@/modules/zone/zone.service';
import { requireAuth } from './auth';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Checks if a relative path corresponds to a publicly accessible resource.
 */
function isPublicFile(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').toLowerCase();
  if (normalized.startsWith('public/')) return true;
  // Designated public/demo sample files if any
  if (normalized === 'test_sample.png' || normalized === 'v1_1_1_sample.jpg') return true;
  return false;
}

/**
 * Extracts student or user identifier from relative path or filename if present.
 * Examples supported:
 * - students/cm12345/resume.pdf -> cm12345
 * - student-B-resume.pdf -> B (or id extracted)
 * - student-cm12345-file.pdf -> cm12345
 * - users/usr123/avatar.png -> usr123
 */
function extractOwnerIdentifier(relPath: string): { type: 'student' | 'user'; id: string } | null {
  const normalized = relPath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length >= 2) {
    if (parts[0].toLowerCase() === 'students') {
      return { type: 'student', id: parts[1] };
    }
    if (parts[0].toLowerCase() === 'users') {
      return { type: 'user', id: parts[1] };
    }
  }

  const filename = parts[parts.length - 1] || '';

  // Check if filename contains a full UUID (e.g. student-35028dd9-bb59-464a-846f-cc80bad80992-resume.pdf)
  const uuidMatch = filename.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    if (filename.toLowerCase().startsWith('user-') || normalized.toLowerCase().startsWith('users/')) {
      return { type: 'user', id: uuidMatch[0] };
    }
    return { type: 'student', id: uuidMatch[0] };
  }

  // Non-UUID patterns: student-<id>-... or student-<id>.<ext>
  const studentPrefixMatch = filename.match(/^student-([a-zA-Z0-9_]+)(?:-|\.|$)/i);
  if (studentPrefixMatch && studentPrefixMatch[1]) {
    return { type: 'student', id: studentPrefixMatch[1] };
  }

  const userPrefixMatch = filename.match(/^user-([a-zA-Z0-9_]+)(?:-|\.|$)/i);
  if (userPrefixMatch && userPrefixMatch[1]) {
    return { type: 'user', id: userPrefixMatch[1] };
  }

  return null;
}

export const secureUploadsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Path sanitization & traversal detection
    const rawPath = req.path || '';

    // Check for null bytes or invalid characters
    if (rawPath.includes('\0') || req.url.includes('%00')) {
      res.status(400).json({ success: false, message: 'Invalid request path' });
      return;
    }

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      res.status(400).json({ success: false, message: 'Malformed URL encoding' });
      return;
    }

    // Explicit rejection of directory traversal sequences
    if (
      decodedPath.includes('..') ||
      rawPath.includes('..') ||
      req.url.includes('%2e%2e') ||
      req.url.includes('%2E%2E') ||
      decodedPath.includes('\\')
    ) {
      res.status(403).json({ success: false, message: 'Access denied: Directory traversal detected' });
      return;
    }

    // Normalize relative path
    const sanitizedRelative = path.normalize(decodedPath).replace(/^[/\\]+/, '');

    // Prevent directory listing
    if (!sanitizedRelative || sanitizedRelative === '.' || sanitizedRelative === '') {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // Resolve target path and verify within uploads directory
    const resolvedPath = path.resolve(uploadsDir, sanitizedRelative);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir + path.sep)) {
      res.status(403).json({ success: false, message: 'Access denied: Invalid path location' });
      return;
    }

    // Verify file existence
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      // Directory listing forbidden
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // 2. Public files can be served directly
    if (isPublicFile(sanitizedRelative)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(resolvedPath);
      return;
    }

    // 3. Private files require authentication & authorization
    requireAuth(req, res, async (authErr?: any) => {
      if (authErr) {
        return next(authErr);
      }

      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Super Admins have full access
      if (user.role === 'admin') {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.sendFile(resolvedPath);
        return;
      }

      const owner = extractOwnerIdentifier(sanitizedRelative);

      if (!owner) {
        // If file is not tagged with student/user owner and user is not admin, deny
        res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
        return;
      }

      if (owner.type === 'student') {
        const orConditions: any[] = [{ registrationNumber: owner.id }];
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner.id);
        if (isUuid) {
          orConditions.push({ id: owner.id });
          orConditions.push({ userId: owner.id });
        }

        // Look up student by studentId, userId, or registrationNumber safely
        const student = await prisma.student.findFirst({
          where: {
            OR: orConditions,
          },
          select: {
            id: true,
            userId: true,
            zoneId: true,
          },
        });

        if (!student) {
          // If student not found in database, deny access to protect foreign/unmatched files
          res.status(404).json({ success: false, message: 'File not found' });
          return;
        }

        if (user.role === 'student') {
          // Student can only access their own private files
          if (student.userId !== user.userId && student.id !== user.userId) {
            res.status(403).json({
              success: false,
              message: 'Forbidden: You cannot access files belonging to another student',
            });
            return;
          }
        } else if (user.role === 'zone') {
          // Zone incharge can only access files of students within their assigned zone
          const assignedZoneId =
            (await zoneService.getAssignedZoneIdForUser(user.userId)) || user.zoneId;

          if (!assignedZoneId || student.zoneId !== assignedZoneId) {
            res.status(403).json({
              success: false,
              message: 'Forbidden: You cannot access student files outside your assigned zone',
            });
            return;
          }
        } else {
          res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
          return;
        }
      } else if (owner.type === 'user') {
        if (user.userId !== owner.id) {
          res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot access files belonging to another user',
          });
          return;
        }
      }

      // Authorized
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(resolvedPath);
    });
  } catch (error: any) {
    next(error);
  }
};
