import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'McKinney & Co - Submission Tracker',
  description: 'Commercial insurance submission tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white antialiased">{children}</body>
    </html>
  )
}
