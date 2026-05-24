import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Create AI-powered question papers for teachers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
