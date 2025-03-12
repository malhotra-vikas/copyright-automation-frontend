import { NextResponse } from "next/server";
import { getClickUpTasks, updateClickUpTaskStatus } from "@/lib/clickup";
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


export async function PUT(req: Request) {
    try {
        const { taskId, status } = await req.json();

        if (!taskId || !status) {
            return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 });
        }

        const cookieStore = cookies();
        const clickupToken = cookieStore.get("clickup_token");

        if (!clickupToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await updateClickUpTaskStatus(taskId, status, clickupToken.value);

        return NextResponse.json({ success: true, message: `Task ${taskId} updated to ${status}` });
    } catch (error) {
        console.error("❌ Error updating ClickUp task:", error);
        return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
    }
}
