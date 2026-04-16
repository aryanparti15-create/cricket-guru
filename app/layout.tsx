import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cricket Guru — IPL AI Analyst',
  description: 'Live IPL session analysis powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
