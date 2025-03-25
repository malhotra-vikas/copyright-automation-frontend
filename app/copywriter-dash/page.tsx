import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import CopywriterTaskList from "@/components/copywriter-task-list"
import { getClickUpTasks } from "@/lib/clickup"

export default async function Dashboard() {
  const cookieStore = cookies()
  const clickupToken = cookieStore.get("clickup_token")

  if (!clickupToken) {
    redirect("/")
  }

  const tasks = await getClickUpTasks(clickupToken.value)

  return (
    <div className="container mx-auto py-8">
      <CopywriterTaskList initialTasks={tasks} /> {/* ✅ Pass initial tasks */}

    </div>
  )
}

