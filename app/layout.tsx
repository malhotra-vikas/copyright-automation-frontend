import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import LogoutButton from "@/components/logout-button"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Ready for AI",
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
                <h1 className="font-semibold">Your Copyrighting Tasks (Pre-Processed by AI)</h1>
                <LogoutButton />
              </div>
            </header>
          )}
          <main className="flex-1">{children}</main>
        </div>
        {/* ✅ Add ToastContainer here */}
        <ToastContainer />        
      </body>
    </html>
  )
}

