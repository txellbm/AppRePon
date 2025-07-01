import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AudioProvider } from '@/providers/audio-provider';
import { AuthProvider } from '@/providers/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RePon',
  description: 'Gestiona tu despensa y lista de compras con facilidad.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-96x96.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RePon',
  },
};

export const viewport: Viewport = {
  themeColor: '#4681D3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} font-body antialiased`}>
        <AuthProvider>
          <AudioProvider>
            <main>{children}</main>
            <Toaster />
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
