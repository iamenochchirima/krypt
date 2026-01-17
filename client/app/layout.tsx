import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"
import { Web3Providers } from "@/providers/web3Provider"
import { WalletConnectionProvider } from "@/connect-wallet"
import { Toaster } from "@/components/ui/sonner"
import { ConfettiProvider } from "@/providers/confetti-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CryptoDotFun - Learn, Earn, Secure, Connect",
  description: "Your blockchain education and engagement platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add a meta tag to disable Dark Reader extension */}
        <meta name="darkreader-lock" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <Web3Providers>
              <WalletConnectionProvider>
                <ConfettiProvider />
                {children}
                <Toaster />
              </WalletConnectionProvider>
            </Web3Providers>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
