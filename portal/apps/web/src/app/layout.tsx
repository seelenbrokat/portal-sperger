import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spedition Sperger – Portal',
  description: 'Kunden- und Partnerportal der Spedition Sperger',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/sperger-logo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
