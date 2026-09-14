import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'iDTRONIC LeadSync',
  description: 'Event Lead Capture & Email Routing System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
