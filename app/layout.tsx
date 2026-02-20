import type { Metadata } from 'next';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export const metadata: Metadata = {
  title: 'CBI Cash Disbursement Management',
  description: 'Cash Disbursement Management Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
