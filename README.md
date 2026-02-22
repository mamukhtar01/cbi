# CBI Cash Disbursement Management

This repository contains the Next.js app for Cash Disbursement Management using TypeScript, Ant Design, and Prisma.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required values (see [Environment Variables](#environment-variables) below):
   ```bash
   cp .env.example .env
   ```
4. Set up the database using Prisma:
   ```bash
   npx prisma migrate dev
   npx prisma seed
   ```
5. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `.env.example` to `.env` and update each value:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | SQLite file path for Prisma. Must start with `file:` and is relative to the location of the Prisma schema file (`prisma/schema.prisma`). | `file:./dev.db` |
| `NEXTAUTH_URL` | The base URL of your running app. | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | A random secret for NextAuth. Generate with `openssl rand -base64 32`. | `your_random_secret` |
| `SEED_ADMIN_EMAIL` | Email for the admin account created by the seed script. | `admin@admin.com` |
| `SEED_ADMIN_PASSWORD` | Password for the admin account created by the seed script. | `admin@123` |
| `SEED_ADMIN_NAME` | Display name for the admin account. | `admin` |
| `TELECOM_DELAY_RATE` | Percentage chance (0–100) that a telecom payment is delayed. | `10` |
| `TELECOM_FAIL_RATE` | Percentage chance (0–100) that a telecom payment fails. | `10` |
| `WAVE_FAIL_RATE` | Percentage chance (0–100) that a Wave push fails. | `10` |