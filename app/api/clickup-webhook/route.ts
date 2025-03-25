import { runAIWorkflowOnTask } from "@/lib/ai-runner";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log("✅ Webhook hit!");

    const body = await req.json();
    console.log("🧾 Full payload:", JSON.stringify(body, null, 2));

    const event = body.event;
    const taskId = body.task_id;
    const history = body.history_items?.[0];
    const newStatus = history?.after?.status;

    console.log("📦 Event:", event);
    console.log("📦 Task ID:", taskId);
    console.log("📦 New status:", newStatus);

    if (event === "taskStatusUpdated" && newStatus?.toLowerCase() === "ready for ai") {
        console.log(`🚀 Task ${taskId} is now Ready for AI!`);

        // ✅ Step 1: Fetch the Clickup Task"
        const clickUpTask = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
            headers: {
                Authorization: `${process.env.CLICKUP_WORKSPACE_TOKEN_FOR_WEBHOOKS}`, 
                Accept: "application/json",
            },
        });

        const fetchedTask = await clickUpTask.json();

        runAIWorkflowOnTask(fetchedTask)
    }

    return NextResponse.json({ message: "Webhook processed" });
}
