import './globals.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Convenience Store Application - Mckinney & Co. Insurance',
  description: 'Professional insurance application form for convenience stores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get Google Maps API key from environment variable
  // Falls back to hardcoded key for local development
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDMyFvqQx5cHw3bZaL85NFWYVo6Dfq8qfo'
  
  return (
    <html lang="en">
      <body className={inter.className}>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,drawing,geometry`}
            strategy="beforeInteractive"
          />
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
