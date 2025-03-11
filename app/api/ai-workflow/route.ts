import { NextResponse } from "next/server"

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY as string

// **Helper: Extract Website from Task**
const getClientWebsiteFromTask = async (task: any): Promise<string> => {

    const websiteField = task.custom_fields.find((field: any) =>
        field.name.toLowerCase() === "client-website"
    )
    console.log("Website found as ", websiteField)
    return websiteField?.value || null
}

// **Fetch AI Summary for a Website**
const fetchWebsiteSummary = async (websiteUrl: string): Promise<string> => {
    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "sonar",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI that analyzes business websites. Given a URL, provide a one-line summary of its key customers and the problems it solves.",
                    },
                    {
                        role: "user",
                        content: `Analyze this website: ${websiteUrl}. Provide a concise summary of its key customers and problems it solves.`,
                    },
                ],
                max_tokens: 100,
                temperature: 0.7,
            }),
        })

        // ✅ Handle Empty or Bad Responses
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API Error: ${response.status} - ${errorText}`)
        }

        // ✅ Ensure response has valid JSON content
        const text = await response.text()
        if (!text) throw new Error("Empty response from Perplexity API")

        const data = JSON.parse(text)


        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim()
        } else {
            throw new Error("No valid response from Perplexity AI")
        }
    } catch (error) {
        console.error(`❌ Perplexity AI Error for ${websiteUrl}:`, error)
        throw new Error("Failed to fetch AI summary")
    }
}

// **API Handler: Process AI Workflow for Tasks**
export async function POST(req: Request) {
    console.log("In Server starting to execute")
    try {
        const { tasks } = await req.json()

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return NextResponse.json({ error: "Invalid task list" }, { status: 400 })
        }

        // Extract websites and run AI processing in parallel
        const results = await Promise.all(
            tasks.map(async (task) => {
                const clientWebsiteUrl = await getClientWebsiteFromTask(task)
                if (!clientWebsiteUrl) return { taskId: task.id, name: task.name, summary: null }

                console.log("clientWebsiteUrl is ", clientWebsiteUrl)

                try {
                    const summary = await fetchWebsiteSummary(clientWebsiteUrl)
                    console.log("summary is ", summary)

                    return { taskId: task.id, name: task.name, summary }
                } catch {
                    return { taskId: task.id, name: task.name, summary: "Failed to generate summary" }
                }
            })
        )

        return NextResponse.json({ results }, { status: 200 })
    } catch (error) {
        console.error("❌ Server Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
