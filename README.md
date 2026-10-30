# Secure Military Personnel Management System

A role-based personnel management application with a React frontend, Spring Boot REST API, MySQL persistence, JWT authentication, TPM-backed device verification, TOTP second-factor verification, and audit logging.

> Use fictional records only for development and demonstrations. Do not store classified, operational, or real sensitive military information in this demo application.

## Technology

- Frontend: React, Vite, React Router
- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA
- Database: MySQL
- Authentication: BCrypt password hashing, short-lived pre-authentication JWTs, TPM RSA challenge-response, TOTP
- TPM helper: .NET minimal API using the Windows Platform Crypto Provider

## Role permissions

| Feature | ADMIN | COMMANDER | OFFICER | PERSONNEL |
| --- | --- | --- | --- | --- |
| Dashboard | Yes | No | No | No |
| View personnel | Yes | Yes | Yes | Own record |
| Create/update/delete personnel | Yes | Yes | No | No |
| View leave requests | All | All | Own requests | Own requests |
| Submit leave request | Yes | Yes | Own request | Own request |
| Approve/reject leave | Yes | Yes | No | No |
| Manage units | Yes | Yes | No | No |
| Manage promotions | Yes | Yes | No | No |
| View audit logs | Yes | No | No | No |
| Manage users and roles | Yes | No | No | No |

The backend enforces permissions independently of frontend navigation and button visibility.

## Authentication flow

1. Username and password are validated by Spring Security.
2. The API issues a short-lived pre-authentication token and a TPM challenge for the user's registered device.
3. The local TPM helper signs the challenge using its non-exportable RSA private key.
4. The backend verifies the signature against the registered public key and marks the challenge as used.
5. The user enters a valid TOTP code from their authenticator app.
6. The API issues the fully authenticated JWT. Protected API requests require both TPM and TOTP verification claims.

A user must have a registered TPM device and an enabled TOTP credential before this login flow can complete.

## Prerequisites

- Java 21
- Maven 3.9+ (or the included Maven Wrapper)
- MySQL
- Node.js compatible with the installed Vite version
- .NET SDK compatible with the TPM helper project
- Windows with a supported TPM 2.0 device for the current TPM helper implementation

## Backend setup

1. Create a MySQL database named `military_personnel_db`.
2. Set the following environment variables before starting Spring Boot:

   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET` — use a strong random secret of at least 32 bytes; do not commit it.
   - `TPM_HELPER_URL` — optional; defaults to `http://127.0.0.1:8765`.
   - `TOTP_ENCRYPTION_KEY` — required for new TOTP enrollment; use a dedicated random value of at least 32 characters and keep it outside source control.
   - `APP_CORS_ALLOWED_ORIGINS` — comma-separated trusted frontend origins; defaults to `http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174`.

3. Start the backend:

   ```bash
   cd military-personnel-management
   ./mvnw spring-boot:run
   ```

The API listens on `http://localhost:8080`.

The current JPA setting is `spring.jpa.hibernate.ddl-auto=update`. Back up the database before running schema-changing builds, and use versioned migrations before production deployment.

## Frontend setup

From the repository root:

```bash
npm install
npm run dev
```

Optional frontend environment variables:

- `VITE_API_BASE_URL` — defaults to `http://localhost:8080/api`
- `VITE_TPM_HELPER_URL` — defaults to `http://127.0.0.1:8765`

For example, create a local `.env.local` file (do not commit it):

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_TPM_HELPER_URL=http://127.0.0.1:8765
```

## TPM helper setup

On the Windows machine that owns the TPM device:

```bash
dotnet run --project MilitaryPmsTpmHelper
```

The helper listens on `http://127.0.0.1:8765`. Its current CORS development allowlist includes Vite on ports 5173 and 5174 using either `localhost` or `127.0.0.1`. The helper creates or opens a TPM-backed RSA key named `MilitaryPMS-TPM-Device-Key`.

The TPM helper is a local development component. Do not expose it to untrusted networks or treat this prototype as a production remote-attestation service.

## Linking a personnel account to a personnel record

A PERSONNEL account must be associated with exactly one row in the `personnel` table. The `users.personnel_id` association is optional for administrative accounts and unique when supplied.

The association can be set when an administrator creates a user by including the personnel record ID:

```json
{
  "username": "service-member-01",
  "password": "use-a-unique-temporary-password",
  "enabled": true,
  "role": { "id": 4 },
  "personnel": { "id": 12 }
}
```

Replace the example role and personnel IDs with the IDs in the actual database. For an existing user, use the administrator-only `PUT /api/users` endpoint and include the existing user ID plus the desired `personnel.id`. The API returns `personnelId` in user responses so administrators can verify the association.

Existing accounts are not automatically linked to personnel records. Until an account is linked, its own-record personnel and leave operations will report that an administrator must configure the association.

## Security notes and current limitations

- Keep database credentials, JWT signing keys, and any local environment files out of source control.
- Use HTTPS, secure secret storage, database encryption, rate limiting, and managed key rotation before any production use.
- TOTP secrets are stored using AES-GCM encryption when `TOTP_ENCRYPTION_KEY` is configured. Existing legacy plaintext secrets remain readable for backward compatibility until reset. After configuring the key, an administrator can reset a user credential through the admin-only `/api/totp/setup-for-user` endpoint and confirm the new code through `/api/totp/confirm-for-user`; this replaces the legacy secret with encrypted storage. Keep the key backed up securely because losing it prevents TOTP verification.
- The TPM helper currently performs local TPM-backed signing; it is not a full remote-attestation protocol.
- Use database migrations rather than relying on automatic schema updates for production.
- Run backend tests, frontend production build, and role-by-role API tests before merging changes into `main`.

## Development branch

Current implementation work is being carried out on `demo-readiness-prep`. The `main` branch is intentionally kept separate until the changes have been reviewed and tested.
