# CBI Cash Disbursement Management

This repository contains the Next.js app for Cash Disbursement Management using TypeScript, Ant Design, and Prisma.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database using Prisma:
   ```bash
   npx prisma migrate dev
   npx prisma seed
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `.env.example` to `.env` and fill in required values.