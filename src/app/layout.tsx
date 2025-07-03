import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';


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
      <body className="font-body antialiased">
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
