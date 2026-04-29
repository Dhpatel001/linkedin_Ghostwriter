import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoicePost — LinkedIn posts that sound exactly like you',
  description:
    'Stop meaning to post. Let AI learn your voice — founders, consultants, and coaches use VoicePost to grow their LinkedIn without writing.',
  keywords: ['LinkedIn', 'AI writing', 'personal brand', 'ghostwriter', 'content'],
  openGraph: {
    title: 'VoicePost — LinkedIn posts that sound exactly like you',
    description:
      '3 posts per week. Zero effort. AI learns your voice and writes in it.',
    type: 'website',
    url: 'https://voicepost.in',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoicePost',
    description: 'AI LinkedIn ghostwriter that writes in your exact voice.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow:
                '0 4px 6px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)',
            },
            classNames: {
              success: 'border-emerald-200 bg-white',
              error: 'border-red-200 bg-white',
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}