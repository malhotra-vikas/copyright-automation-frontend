import { NextResponse } from "next/server"

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY as string

const PITCH_MATCH_TEST_RUN_LIMIT = Number(process.env.PITCH_MATCH_TEST_RUN) || 10;

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

// ✅ Function to Process Pitch-Match AI
async function processPitchMatchAI(airtableRecord: any): Promise<string> {
    const recordData = airtableRecord.fields;

    //console.log("AI Processing airtable Record - ", recordData)
    const pitchSite = recordData["Website"]

    const prompt = `Analyze the ${pitchSite} and draft a pitch of no more than 45 words. The pitch should read natural as if a human has written it. 
                    The pitch must be like this or similar - I came across your website when searching for [X] and noticed you helping [Y] Group with [Z] solution.
                    Fill in relevant information in X, Y and Z placeholders. Include some relevant product examples.
                    No Not add any formating. No not include anything else apart from the draft pitch statement`;

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
                        content: "You are an AI that analyzes business websites and help build compelling pitches for cold calling and cold emailing.",
                    },
                    {
                        role: "user",
                        content: prompt,
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
        console.error(`❌ Perplexity AI Error for ${pitchSite}:`, error)
        throw new Error("Failed to fetch AI summary")
    }

}

// **API Handler: Process AI Workflow for Tasks**
export async function POST(req: Request) {
    try {
        // ✅ Parse request body
        const { airtableRecords, aiTaskType, testDrive } = await req.json();

        console.log("📡 Received Type:", aiTaskType);
        console.log("📡 Received Air Table Records:", airtableRecords.length, "tasks");

        console.log("📡 Received pitch_match_at_scale:", testDrive);

        if (!Array.isArray(airtableRecords) || airtableRecords.length === 0) {
            return NextResponse.json({ error: "Invalid task list" }, { status: 400 })
        }

        // ✅ Handle Different AI Workflow Types
        let aiResults = [];

        if (aiTaskType === "Pitch-Match") {
            console.log("🚀 Running AI Workflow: Pitch-Match");

            let limitedRecords

            if (testDrive && testDrive == "Yes") {
                // ✅ Apply Task Limit
                limitedRecords = airtableRecords.slice(0, PITCH_MATCH_TEST_RUN_LIMIT);
                console.log(`✅ Test-Run - Processing only ${limitedRecords.length} AirTable Records  (limit: ${PITCH_MATCH_TEST_RUN_LIMIT})`);
            } else {
                limitedRecords = airtableRecords
            }

            aiResults = await Promise.all(
                limitedRecords.map(async (record) => {
                    try {
                        const summary = await processPitchMatchAI(record);
                        //console.log("Airtable Record processed is ", record)
                        return { recordId: record.id, name: record.fields["full name"], summary };
                    } catch (error) {
                        console.error(`❌ AI Error for Task ID ${record.id}:`, error);
                        return { recordId: record.id, name: record.fields["full name"], summary: "Failed to generate summary" };
                    }
                })
            );
        } else {
            console.log("⚠️ Unknown AI Workflow Type:", aiTaskType);
            return NextResponse.json({ error: "Unsupported AI workflow type" }, { status: 400 });
        }
        const responsePayload = { results: aiResults };

        console.log("✅ AI Workflow Completed:", JSON.stringify(responsePayload, null, 2));
        return NextResponse.json(responsePayload, { status: 200 });
        /*
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
*/
    } catch (error) {
        console.error("❌ Server Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
