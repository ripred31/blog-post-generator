import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Blog Post Creator',
  description: 'Transform your development notes into polished blog posts with AI assistance',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen dark:bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  )
}
