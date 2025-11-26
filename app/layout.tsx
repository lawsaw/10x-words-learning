import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: '10xWordsLearning',
    template: '%s | 10xWordsLearning',
  },
  description:
    'A powerful vocabulary workspace for learning new words. Create thematic lists, review definitions, and practice with interactive tools.',
  keywords: [
    'vocabulary',
    'language learning',
    'word lists',
    'flashcards',
    'education',
    'study tools',
    'spaced repetition',
  ],
  authors: [{ name: '10xWordsLearning Team' }],
  creator: '10xWordsLearning',
  publisher: '10xWordsLearning',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://10xwordslearning.com',
    title: '10xWordsLearning',
    description:
      'Master vocabulary with our efficient workspace. Create thematic lists and practice effectively.',
    siteName: '10xWordsLearning',
  },
  twitter: {
    card: 'summary_large_image',
    title: '10xWordsLearning',
    description:
      'Master vocabulary with our efficient workspace. Create thematic lists and practice effectively.',
    creator: '@10xWordsLearning',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
