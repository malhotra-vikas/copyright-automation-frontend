import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const currentUrl = request.nextUrl.pathname
    const clickupToken = request.cookies.get("clickup_token")

    // Protected routes
    if (currentUrl.startsWith("/dashboard") && !clickupToken) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    // Redirect to dashboard if already logged in
    if ((currentUrl === "/" || currentUrl.startsWith("/api/auth/callback")) && clickupToken) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/", "/dashboard/:path*", "/api/auth/callback"],
}

