import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import LandingPage from "@/components/landing-page"

export default function Home() {
  const cookieStore = cookies()
  const clickupToken = cookieStore.get("clickup_token")

  // If token exists, redirect to dashboard
  if (clickupToken) {
    redirect("/dashboard")
  }

  return <LandingPage />
}

