export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/beneficiaries/:path*',
    '/payments/:path*',
    '/budget-lines/:path*',
    '/alerts/:path*',
    '/audit-logs/:path*',
    '/reconciliation/:path*',
    '/api/beneficiaries/:path*',
    '/api/payments/:path*',
    '/api/budget-lines/:path*',
    '/api/alerts/:path*',
    '/api/audit-logs/:path*',
    '/api/dashboard/:path*',
  ],
};
