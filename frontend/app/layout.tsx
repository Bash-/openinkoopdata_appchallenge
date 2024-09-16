import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime.js"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : undefined,
  title: {
    default: 'TenderFlow',
    template: `%s - AI Tenderportaal`
  },
  description: 'Open source Tenderportaal dat met behulp van AI vragen kan beantwoorden over aanbestedingen van het Rijk',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    // apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <LanguageProvider>
      <html lang={languageTag()} suppressHydrationWarning>
        <body
          className={cn(
            'font-sans antialiased',
            GeistSans.variable,
            GeistMono.variable
          )}
        >
          <Toaster position="top-center" />
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
            </div>
            <TailwindIndicator />
          </Providers>
        </body>
      </html>
    </LanguageProvider>
  )
}
