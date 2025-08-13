// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Home D3IF Dashboard',
  description: 'ESP32 Smart Home Control Dashboard with real-time monitoring',
  keywords: 'ESP32, Smart Home, IoT, Dashboard, Next.js, React',
  authors: [{ name: 'Smart Home Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-slate-50 to-slate-100`}>
        <div className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}