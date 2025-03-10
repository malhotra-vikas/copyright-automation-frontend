"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/")
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    return (
        <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    )
}

