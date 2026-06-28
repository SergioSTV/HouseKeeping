import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata: Metadata = {
  title: '4RHousekeeping',
  description: 'Operativa de Pisos y Recepcion en tiempo real',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1D5FA5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var s=localStorage.getItem('textScale');var m={normal:'100%',grande:'112.5%',xl:'125%'};document.documentElement.style.fontSize=m[s]||'100%';}catch(e){}",
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
