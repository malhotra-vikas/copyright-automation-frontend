import { NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;  // Store in .env.local
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;  // Store in .env.local
const AIRTABLE_TABLE_NAME = "Client-Leads"; // Change based on your Airtable table
const AIRTABLE_DATA_COUNT = Number(process.env.AIRTABLE_DATA_WRITE_COUNT) || -1; // Default to 100
const MAX_AIRTABLE_BATCH_SIZE = 10; // Airtable allows only 10 records per request

export async function POST(req: Request) {
    try {
        let body = await req.json();
        let data = body.data;

        let client = body.client
        let clientSlack = body.clientSlack
        let clientOnboardingDoc = body.onboardindDocument


        console.log("📡 Data Type:", typeof data);
        console.log("📡 Is Array?:", Array.isArray(data));
        console.log("📡 Data Length:", Array.isArray(data) ? data.length : "Not an array");

        console.log("🔍 Debugging Airtable API Connection...");
        console.log("📡 AIRTABLE_API_KEY:", AIRTABLE_API_KEY ? "✅ Loaded" : "❌ MISSING");
        console.log("📡 AIRTABLE_BASE_ID:", AIRTABLE_BASE_ID);
        console.log("📡 AIRTABLE_TABLE_NAME:", AIRTABLE_TABLE_NAME);
        console.log("📡 AIRTABLE_DATA_COUNT:", AIRTABLE_DATA_COUNT);

        console.log("📡 client:", client);
        console.log("📡 clientSlack:", clientSlack);
        console.log("📡 clientOnboardingDoc:", clientOnboardingDoc);

        // ✅ Ensure `data` is an array
        if (!Array.isArray(data)) {
            console.error("❌ Data is not an array. Converting...");
            data = Object.values(data);
        } else if (Array.isArray(data[0])) {
            console.error("❌ Data is nested in an array. Flattening...");
            data = data.flat();  // 🛠 Fix: Flatten the array
        }

        if (AIRTABLE_DATA_COUNT && AIRTABLE_DATA_COUNT > 0) {
            data = data.slice(0, AIRTABLE_DATA_COUNT)
        }
        console.log(`✅ Storing top ${AIRTABLE_DATA_COUNT} records in Airtable`);

        //console.log(`✅ Storing ${data} in Airtable`);

        // ✅ Prepare Data for Airtable API
        const records = data.map(record => {
            console.log("🔍 Processing Record:", record);
            return {
                fields: {
                    "full name": record["full name"] || "Missing Name",
                    "First Name": record["First Name"] || "Unknown",
                    "Final email": record["Final email"] || "no-email@placeholder.com",
                    "Company name": record["Company name"] || "Unknown Company",
                    "Title": record["Title"] || "No Title",
                    "Website": record["Website"] || "http://unknown.com",
                    "status": "new",
                    "client id": client,
                    "client slack": clientSlack,
                    "client onboarding doc": clientOnboardingDoc
                }
            };
        });

        console.log(`✅ Prepared ${records.length} records for Airtable`);


        // ✅ Split into batches of 10
        const batchPromises = [];
        for (let i = 0; i < records.length; i += MAX_AIRTABLE_BATCH_SIZE) {
            const batch = records.slice(i, i + MAX_AIRTABLE_BATCH_SIZE);
            console.log(`📡 Sending batch of ${batch.length} records to Airtable...`);

            batchPromises.push(
                fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ records: batch })
                })
                    .then(res => res.json())
                    .then(resData => {
                        if (resData.error) {
                            throw new Error(`Airtable API Error: ${JSON.stringify(resData)}`);
                        }
                        console.log("✅ Successfully stored batch:", JSON.stringify(resData, null, 2));
                        return resData.records;
                    })
            );
        }

        // ✅ Wait for all batches to complete
        const storedRecords = (await Promise.all(batchPromises)).flat();
        console.log(`🎉 Successfully stored ${storedRecords.length} records in Airtable`);

        return NextResponse.json({ success: true, storedRecords }, { status: 200 });

    } catch (error) {
        console.error("❌ Airtable API Error:", error);
        return NextResponse.json({ error: "Failed to store data in Airtable" }, { status: 500 });
    }
}
