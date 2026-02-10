import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Track workouts and training plans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-6">
            <a href="/" className="font-semibold text-gray-900">Workout Tracker</a>
            <a href="/athlete" className="text-gray-600 hover:text-gray-900">Athlete</a>
            <a href="/trainer" className="text-gray-600 hover:text-gray-900">Trainer</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
