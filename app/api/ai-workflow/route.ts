import { NextResponse } from "next/server"

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY as string

const PITCH_TEST_RUN_LIMIT = Number(process.env.PITCH_TEST_RUN) || 10;


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


// ✅ Function to Process Pitch-Product AI
async function processPitchCTAAI(airtableRecord: any, pitchMatch: string, pitchProduct: string): Promise<string> {
    const recordData = airtableRecord.fields;

    //console.log("AI Processing airtable Record - ", recordData)
    const pitchClientOnboardingDoc = recordData["client onboarding doc"]
    const pitchClientName = recordData["client id"]
    const pitchLeadWebsite = recordData["Website"]

    const prompt = `Based on the customer's business and product : "${pitchMatch}" and how the client's solution can help described in ${pitchProduct}. 
                    Draft a call to action of no more than 20 words for CLIENT ${pitchClientName}.
                    Use clear, professional and factual language. Do not add superlatives, exaggerations or marketing buzzworkds. 
                    Keep the tone informative and neutral.
                    Use natural language, and include relevant product examples without formatting.
                    No not include anything else apart from the draft pitch statement`;
                    
    console.log("Prompt being run is ", prompt)                    

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
        console.error(`❌ Perplexity AI Error for ${pitchClientOnboardingDoc}:`, error)
        throw new Error("Failed to fetch AI summary")
    }

}

// ✅ Function to Process Pitch-Product AI
async function processPitchProductAI(airtableRecord: any, clientOnboardingDocument: string): Promise<string> {
    const recordData = airtableRecord.fields;

    //console.log("AI Processing airtable Record - ", recordData)
    const pitchClientOnboardingDoc = recordData["client onboarding doc"]
    const pitchClientName = recordData["client id"]
    const pitchLeadWebsite = recordData["Website"]

    const docContent = clientOnboardingDocument;

    console.log("docContent fetched (first 100 chars):", docContent);

    const prompt = `Based on the following document content: "${docContent}". 
                    Draft a pitch of no more than 100 words for CLIENT ${pitchClientName}.
                    The pitch should explain how their product or service helps businesses like ${pitchLeadWebsite}.
                    Use clear, professional and factual language. Do not add superlatives, exaggerations or marketing buzzworkds. 
                    Keep the tone informative and neutral.
                    Use natural language, and include relevant product examples without formatting.
                    No not include anything else apart from the draft pitch statement`;
                    
    console.log("Prompt being run is ", prompt)                    

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
        console.error(`❌ Perplexity AI Error for ${pitchClientOnboardingDoc}:`, error)
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
                    Use clear, professional and factual language. Do not add superlatives, exaggerations or marketing buzzworkds. 
                    Keep the tone informative and neutral.
                    No Not add any formatting. No not include anything else apart from the draft pitch statement`;

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
        // ✅ Parse request body safely
        const body = await req.json();
        const { airtableRecords, testDrive, clientOnboardingDocument } = body || {};  // Prevents `undefined` errors

        console.log("📡 Received Air Table Records:", airtableRecords?.length ?? 0, "tasks");
        console.log("📡 Received pitch_match_at_scale:", testDrive);

        // ✅ Validate required fields
        if (!airtableRecords || !Array.isArray(airtableRecords) || airtableRecords.length === 0) {
            return NextResponse.json({ error: "Invalid or missing airtableRecords array" }, { status: 400 });
        }

        let limitedRecords = airtableRecords;
        //const PITCH_TEST_RUN_LIMIT = Number(process.env.PITCH_TEST_RUN) || 10;

        if (testDrive === "Yes") {
            // ✅ Apply Task Limit
            limitedRecords = airtableRecords.slice(0, PITCH_TEST_RUN_LIMIT);
            console.log(`✅ Test-Run - Processing only ${limitedRecords.length} AirTable Records (limit: ${PITCH_TEST_RUN_LIMIT})`);
        }

        // ✅ Process AI Tasks in Parallel
        const aiResults = await Promise.all(
            limitedRecords.map(async (record) => {
                try {
                    const pitchMatch = await processPitchMatchAI(record);
                    const pitchProduct = await processPitchProductAI(record, clientOnboardingDocument);
                    const pitchCta = await processPitchCTAAI(record, pitchMatch, pitchProduct);

                    return {
                        recordId: record.id,
                        name: record.fields["full name"],
                        pitchMatch,
                        pitchProduct,
                        pitchCta
                    };
                } catch (error) {
                    console.error(`❌ AI Error for Task ID ${record.id}:`, error);
                    return {
                        recordId: record.id,
                        name: record.fields["full name"],
                        pitchMatch: "Failed to generate summary",
                        pitchProduct: "Failed to generate summary",
                        pitchCta: "Failed to generate summary"
                    };
                }
            })
        );

        console.log("✅ AI Workflow Completed:", JSON.stringify(aiResults, null, 2));
        return NextResponse.json({ results: aiResults }, { status: 200 });

    } catch (error) {
        console.error("❌ Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
