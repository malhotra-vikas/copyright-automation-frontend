import { NextResponse } from "next/server";
import { getClickUpTasks } from "@/lib/clickup";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = cookies();
    const clickupToken = cookieStore.get("clickup_token");

    if (!clickupToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await getClickUpTasks(clickupToken.value);
    return NextResponse.json(tasks);
}
