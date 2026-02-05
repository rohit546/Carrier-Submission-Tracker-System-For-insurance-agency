import type { Metadata } from 'next'
import Script from 'next/script'
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
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  return (
    <html lang="en">
      <body className="bg-white antialiased">
        {googleMapsApiKey ? (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,drawing,geometry`}
            strategy="beforeInteractive"
          />
        ) : (
          <Script id="google-maps-warning">
            {`console.warn('⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Address autocomplete and measurement tools will not work.');`}
          </Script>
        )}
        {children}
      </body>
    </html>
  )
}
