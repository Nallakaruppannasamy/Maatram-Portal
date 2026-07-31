-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'zone', 'admin');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending_first_login', 'activated', 'password_changed');

-- CreateEnum
CREATE TYPE "VolunteerCategory" AS ENUM ('Education', 'Healthcare', 'Environment', 'DisasterRelief', 'CommunityOutreach');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('approved', 'rejected', 'pending', 'info', 'alert');

-- CreateEnum
CREATE TYPE "AuditActorRole" AS ENUM ('student', 'zone', 'admin', 'system');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255),
    "registerNumber" VARCHAR(20),
    "passwordHash" TEXT NOT NULL,
    "tempPassword" TEXT,
    "role" "UserRole" NOT NULL,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "mobile" VARCHAR(15),
    "gender" VARCHAR(30),
    "dateOfBirth" DATE,
    "careerObjective" TEXT,
    "cgpa" DECIMAL(4,2),
    "currentSemester" VARCHAR(20),
    "batch" VARCHAR(10) NOT NULL,
    "zoneId" UUID NOT NULL,
    "collegeId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "verificationCode" VARCHAR(30) NOT NULL,
    "resumeLastGeneratedAt" TIMESTAMPTZ,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'pending_first_login',

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "regionLabel" VARCHAR(150) NOT NULL,
    "inchargeId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "zoneId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "collegeId" UUID NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "departmentId" UUID NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "gpa" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "semester_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submissionCode" VARCHAR(30) NOT NULL,
    "studentId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" "VolunteerCategory" NOT NULL,
    "organization" VARCHAR(200) NOT NULL,
    "hours" DECIMAL(5,1) NOT NULL,
    "eventDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "proofFileUrl" TEXT,
    "proofFileName" VARCHAR(255),
    "proofFileSizeBytes" INTEGER,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'pending',
    "reviewerComment" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "volunteer_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "skillName" VARCHAR(50) NOT NULL,
    "addedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" VARCHAR(500) NOT NULL,
    "githubUrl" VARCHAR(500),
    "demoUrl" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "issuer" VARCHAR(200) NOT NULL,
    "issueDate" DATE NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "logCode" VARCHAR(20) NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" "AuditActorRole" NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "targetEntityType" VARCHAR(50) NOT NULL,
    "targetEntityId" UUID,
    "targetLabel" VARCHAR(200) NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_imports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "importedById" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "duplicateCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "importedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_registerNumber_key" ON "users"("registerNumber");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_verificationCode_key" ON "students"("verificationCode");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_zoneId_idx" ON "students"("zoneId");

-- CreateIndex
CREATE INDEX "students_collegeId_idx" ON "students"("collegeId");

-- CreateIndex
CREATE INDEX "students_departmentId_idx" ON "students"("departmentId");

-- CreateIndex
CREATE INDEX "students_programId_idx" ON "students"("programId");

-- CreateIndex
CREATE INDEX "students_accountStatus_idx" ON "students"("accountStatus");

-- CreateIndex
CREATE INDEX "students_zoneId_collegeId_idx" ON "students"("zoneId", "collegeId");

-- CreateIndex
CREATE INDEX "students_accountStatus_zoneId_idx" ON "students"("accountStatus", "zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "zones_inchargeId_key" ON "zones"("inchargeId");

-- CreateIndex
CREATE INDEX "zones_inchargeId_idx" ON "zones"("inchargeId");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- CreateIndex
CREATE INDEX "colleges_zoneId_idx" ON "colleges"("zoneId");

-- CreateIndex
CREATE INDEX "departments_collegeId_idx" ON "departments"("collegeId");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE INDEX "semester_grades_studentId_idx" ON "semester_grades"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "semester_grades_studentId_semesterNumber_key" ON "semester_grades"("studentId", "semesterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_submissions_submissionCode_key" ON "volunteer_submissions"("submissionCode");

-- CreateIndex
CREATE INDEX "volunteer_submissions_studentId_idx" ON "volunteer_submissions"("studentId");

-- CreateIndex
CREATE INDEX "volunteer_submissions_zoneId_idx" ON "volunteer_submissions"("zoneId");

-- CreateIndex
CREATE INDEX "volunteer_submissions_reviewedById_idx" ON "volunteer_submissions"("reviewedById");

-- CreateIndex
CREATE INDEX "volunteer_submissions_status_idx" ON "volunteer_submissions"("status");

-- CreateIndex
CREATE INDEX "volunteer_submissions_eventDate_idx" ON "volunteer_submissions"("eventDate");

-- CreateIndex
CREATE INDEX "volunteer_submissions_zoneId_status_createdAt_idx" ON "volunteer_submissions"("zoneId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "volunteer_submissions_studentId_status_eventDate_idx" ON "volunteer_submissions"("studentId", "status", "eventDate" DESC);

-- CreateIndex
CREATE INDEX "volunteer_submissions_zoneId_eventDate_status_idx" ON "volunteer_submissions"("zoneId", "eventDate", "status");

-- CreateIndex
CREATE INDEX "skills_studentId_idx" ON "skills"("studentId");

-- CreateIndex
CREATE INDEX "projects_studentId_idx" ON "projects"("studentId");

-- CreateIndex
CREATE INDEX "certifications_studentId_idx" ON "certifications"("studentId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "notifications"("recipientId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_logCode_key" ON "audit_logs"("logCode");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "enrollment_imports_importedById_idx" ON "enrollment_imports"("importedById");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_revokedAt_idx" ON "refresh_tokens"("revokedAt");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_inchargeId_fkey" FOREIGN KEY ("inchargeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_grades" ADD CONSTRAINT "semester_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_submissions" ADD CONSTRAINT "volunteer_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_imports" ADD CONSTRAINT "enrollment_imports_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

