import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Vyro Music',
  description: 'AI-powered music streaming platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="mesh-bg h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
