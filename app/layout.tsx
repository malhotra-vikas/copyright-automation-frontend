import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import LogoutButton from "@/components/logout-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ClickUp Task Manager",
  description: "View your ClickUp tasks that are ready for AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const isLoggedIn = cookieStore.has("clickup_token")

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {isLoggedIn && (
            <header className="border-b">
              <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <h1 className="font-semibold">ClickUp Task Manager</h1>
                <LogoutButton />
              </div>
            </header>
          )}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}

