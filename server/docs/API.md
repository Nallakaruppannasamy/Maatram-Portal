# Maatram Portal Backend API Reference

This document details the complete endpoint registry for Version 1 of the Maatram Portal Backend.

All base paths are prefixed with `/api/v1`. All endpoints return standard JSend-like envelopes:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "meta": { "totalCount": 10, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

## 1. Authentication & Session Module (`/auth`)

### Login
* **URL**: `/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "identifier": "arun.s@maatram.org",
    "password": "Admin@123"
  }
  ```
* **Response**: Sets an HTTP-only cookie `refreshToken` and returns:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "ey...",
      "refreshToken": "ey...",
      "user": {
        "id": "uuid",
        "email": "email@org.org",
        "role": "admin",
        "isFirstLogin": false,
        "fullName": "Name"
      }
    }
  }
  ```

### Refresh Token
* **URL**: `/auth/refresh`
* **Method**: `POST`
* **Access**: Public (accepts `refreshToken` in request body, `x-refresh-token` header, or cookie)
* **Response**: Rotates refresh token and returns new access/refresh tokens.

### Logout
* **URL**: `/auth/logout`
* **Method**: `POST`
* **Access**: Authenticated
* **Response**: Revokes active refresh token and clears cookie.

### Forgot Password
* **URL**: `/auth/forgot-password`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "identifier": "user@maatram.org"
  }
  ```
* **Response**: Captures recovery request, generates 1-hour hex token, logs reset link. Returns `200 OK` regardless of email existence to prevent user enumeration.

### Reset Password
* **URL**: `/auth/reset-password`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "token": "reset_token_hex",
    "password": "NewSecurePassword@123"
  }
  ```

### Change Password (Forced / Normal)
* **URL**: `/auth/change-password`
* **Method**: `POST`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "currentPassword": "TempPassword123",
    "newPassword": "NewSecurePassword@123",
    "confirmPassword": "NewSecurePassword@123"
  }
  ```

---

## 2. Organization Module (`/organizations`)

### Create Organization
* **URL**: `/organizations`
* **Method**: `POST`
* **Access**: Admin only
* **Request Body**:
  ```json
  {
    "name": "Organization Name",
    "code": "ORG-CODE",
    "description": "Optional details"
  }
  ```

### Update Organization
* **URL**: `/organizations/:id`
* **Method**: `PUT`
* **Access**: Admin only

### Get Organization Details
* **URL**: `/organizations/:id`
* **Method**: `GET`
* **Access**: Admin, Zone

### List Organizations
* **URL**: `/organizations`
* **Method**: `GET`
* **Access**: Admin, Zone
* **Query Parameters**:
  * `page` (number, default: 1)
  * `limit` (number, default: 10)
  * `search` (string)
  * `sortBy` (string, default: `createdAt`)
  * `sortOrder` (`asc` | `desc`)

---

## 3. Zone Module (`/zones`)

### Create Zone
* **URL**: `/zones`
* **Method**: `POST`
* **Access**: Admin only
* **Request Body**:
  ```json
  {
    "name": "Zone Name",
    "code": "ZONE-CODE",
    "regionLabel": "Region Description",
    "organizationId": "organization_uuid"
  }
  ```

### Update Zone
* **URL**: `/zones/:id`
* **Method**: `PUT`
* **Access**: Admin only

### List Zones
* **URL**: `/zones`
* **Method**: `GET`
* **Access**: Admin, Zone
* **Query Parameters**:
  * `organizationId` (filter)
  * `search` (filter)

---

## 4. User Management Module (`/users`)

### Provision User (Admin/Staff/Zone Manager)
* **URL**: `/users`
* **Method**: `POST`
* **Access**: Admin only
* **Request Body**:
  ```json
  {
    "email": "user@maatram.org",
    "role": "zone",
    "employeeId": "EMP-10",
    "fullName": "Full Name",
    "mobile": "9999988888",
    "designation": "Incharge",
    "organizationId": "org_uuid",
    "zoneId": "zone_uuid"
  }
  ```
* **Response**: Returns temporary auto-generated password.

### Update User
* **URL**: `/users/:id`
* **Method**: `PUT`
* **Access**: Admin only

### Deactivate User
* **URL**: `/users/:id/deactivate`
* **Method**: `PATCH`
* **Access**: Admin only

### Activate User
* **URL**: `/users/:id/activate`
* **Method**: `PATCH`
* **Access**: Admin only

---

## 5. Student Management Module (`/students`)

### Create Student
* **URL**: `/students`
* **Method**: `POST`
* **Access**: Admin only
* **Request Body**: Complete profile payload with relations (`organizationId`, `zoneId`, `collegeId`, `departmentId`, `programId`).

### Update Student
* **URL**: `/students/:id`
* **Method**: `PUT`
* **Access**: Admin only

### Change Student Status
* **URL**: `/students/:id/status`
* **Method**: `PATCH`
* **Access**: Admin only
* **Request Body**:
  ```json
  {
    "status": "SUSPENDED"
  }
  ```

### List Students
* **URL**: `/students`
* **Method**: `GET`
* **Access**: Admin, Zone
* **Query Parameters**:
  * `page`, `limit`, `search`, `sortBy`, `sortOrder`
  * `organizationId`, `zoneId`, `collegeId`, `departmentId`, `status`, `batch`

### Export Students
* **URL**: `/students/export`
* **Method**: `GET`
* **Access**: Admin, Zone
* **Query Parameters**:
  * `format` (`csv` | `xlsx`)
  * `search`, `page`, `limit` (respects current view pagination and filters)

### Get Import Template
* **URL**: `/students/template`
* **Method**: `GET`
* **Access**: Admin only
* **Response**: Binary Excel file (.xlsx) containing the 4 required columns (Student Name, Register Number, Email, Date Of Birth) and a sample data row.

### Import Students (Excel / CSV)
* **URL**: `/students/import`
* **Method**: `POST`
* **Access**: Admin only
* **Payload**: Multipart form upload containing a file field named `file` (Excel .xlsx, .xls or CSV format). Executes transactionally; any single failure rolls back the entire batch.

### Manual Student Registration
* **URL**: `/students/manual`
* **Method**: `POST`
* **Access**: Admin only
* **Request Body**:
  ```json
  {
    "studentName": "Adhithya Vardhan",
    "registrationNumber": "2024CS109",
    "email": "student@example.com",
    "dateOfBirth": "2004-06-08"
  }
  ```
* **Response**: Returns the created student object. Generates temporary password matching `dd/mm/yyyy` from dateOfBirth, triggers Welcome Email, and records audit trail.

---

## 6. Volunteer Management Module (`/volunteers`)

This module manages volunteer user profiles (Admin) as well as Student volunteer activity logs and submissions (Student, Zone, Admin).

### Create Volunteer / Submit Activity Log
* **URL**: `/volunteers`
* **Method**: `POST`
* **Access**: Admin (to create profiles) or Student (to submit volunteering logs)
* **Request Body (Student Activity Log Submission)**:
  ```json
  {
    "title": "Tele-verification of candidates",
    "category": "TELE_VERIFICATION",
    "description": "Background check on provisional student candidates.",
    "eventDate": "2026-08-01",
    "count": 25,
    "imageUrl": "/uploads/volunteer-12345.png"
  }
  ```
  *(Note: `count` is mandatory only for `TELE_VERIFICATION`, `PHYSICAL_VERIFICATION`, and `SCHOOL_VISIT`.)*

* **Request Body (Admin Volunteer Creation)**:
  ```json
  {
    "volunteerId": "VOL-101",
    "firstName": "Vikram",
    "lastName": "Rao",
    "gender": "MALE",
    "dateOfBirth": "1995-10-15",
    "email": "vikram.rao@maatram.org",
    "mobile": "9999988888",
    "organizationId": "org_uuid",
    "zoneId": "zone_uuid",
    "volunteerType": "Professional",
    "joiningDate": "2024-01-10",
    "skills": ["Mentoring"]
  }
  ```

### Update Volunteer Profile
* **URL**: `/volunteers/:id`
* **Method**: `PUT`
* **Access**: Admin only

### Upload Volunteer Proof Image
* **URL**: `/volunteers/upload`
* **Method**: `POST`
* **Access**: Authenticated (Student, Zone, Admin)
* **Request Body**: Multipart form data with file attachment under field name `file`. (JPEG, PNG, WEBP up to 5MB).
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "url": "/uploads/volunteer-17859239.png"
    }
  }
  ```

### Change Status (Profile or Submission)
* **URL**: `/volunteers/:id/status`
* **Method**: `PATCH`
* **Access**: Admin, Zone
* **Request Body (Volunteer Submission Status Review)**:
  ```json
  {
    "status": "APPROVED",
    "reviewerComment": "Excellent work verified."
  }
  ```
  *(Note: `reviewerComment` is mandatory when status is `REJECTED`.)*

### Add / Update Reviewer Comment
* **URL**: `/volunteers/:id/comment`
* **Method**: `PATCH`
* **Access**: Admin, Zone
* **Request Body**:
  ```json
  {
    "comment": "Audit trail comment"
  }
  ```

### Get Details (Profile or Submission)
* **URL**: `/volunteers/:id`
* **Method**: `GET`
* **Access**: Authenticated (Student can only access their own submissions; Zone managers can only access submissions from their assigned Zone; Admins can access all)

### List Volunteers or Submissions
* **URL**: `/volunteers`
* **Method**: `GET`
* **Access**: Authenticated (Student lists their own history; Zone managers list pending queue for their zone; Admins list all)
* **Query Parameters**:
  * `page`, `limit`, `search`, `status`
