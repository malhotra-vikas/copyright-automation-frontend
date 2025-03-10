import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    console.log("The colde is ", code)

    if (!code) {
        return new Response("No code provided", { status: 400 })
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch("https://api.clickup.com/api/v2/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.CLICKUP_CLIENT_ID,
                client_secret: process.env.CLICKUP_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
            }),
        })
        console.log("The tokenResponse is ", tokenResponse)

        if (!tokenResponse.ok) {
            throw new Error("Failed to exchange code for token")
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        console.log("The accessToken is ", accessToken)

        // Set cookie with 1 year expiry
        const oneYear = 365 * 24 * 60 * 60 * 1000
        const cookieStore = cookies()
        cookieStore.set("clickup_token", accessToken, {
            expires: new Date(Date.now() + oneYear),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        })

        return redirect("/dashboard")
    } catch (error) {
        console.error("Error during OAuth callback:", error)
        return new Response("Authentication failed", { status: 500 })
    }
}

