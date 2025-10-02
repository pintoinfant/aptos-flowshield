import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { WalletProvider } from '@/components/wallet-provider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'FlowShield | Aptos Privacy',
  description: 'Your On-Chain Privacy Shield - Break the link between your wallets with FlowShield on Aptos',
  generator: 'FlowShield',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <WalletProvider>{children}</WalletProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
