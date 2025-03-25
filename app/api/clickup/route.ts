import { NextResponse } from "next/server";
import { getClickUpTaskById, getClickUpTasks, updateClickUpTaskStatus } from "@/lib/clickup";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const cookieStore = cookies();
    const clickupToken = cookieStore.get("clickup_token");

    if (!clickupToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");

    if (taskId) {
        console.log("")
        try {
            const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    Authorization: clickupToken.value
                }
            });

            if (!response.ok) {
                throw new Error(`ClickUp API error: ${response.statusText}`);
            }

            const task = await response.json();

            const clickUpTask = {
                id: task.id,
                name: task.name,
                description: task.description || "",
                status: {
                    status: task.status?.status || "unknown"
                },
                date_created: new Date(Number(task.date_created)).toISOString(),
                url: task.url,
                custom_fields: task.custom_fields?.map((field: any) => ({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    value: field.value ?? null
                })) || []
            };

            return NextResponse.json(clickUpTask);
        } catch (error) {
            console.error("❌ Error fetching task by ID:", error);
            return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
        }
    } else {
        const tasks = await getClickUpTasks(clickupToken.value);
        return NextResponse.json(tasks);
    }

}


export async function PUT(req: Request) {
    try {
        const { taskId, status } = await req.json();

        if (!taskId || !status) {
            return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 });
        }

        // 🧠 First try Authorization header (server-to-server use)
        let clickupToken = req.headers.get("Authorization");

        // 🧠 Fallback to cookies (browser use)
        if (!clickupToken) {
            const cookieStore = cookies();
            const tokenFromCookie = cookieStore.get("clickup_token");
            clickupToken = tokenFromCookie?.value;
        }

        if (!clickupToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await updateClickUpTaskStatus(taskId, status, clickupToken);

        return NextResponse.json({ success: true, message: `Task ${taskId} updated to ${status}` });
    } catch (error) {
        console.error("❌ Error updating ClickUp task:", error);
        return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
    }
}
