import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""; // Optional

const extractSheetId = (sheetUrl: string): string | null => {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

export async function POST(req: Request) {
    try {
        const { sheetUrl } = await req.json();
        const sheetId = extractSheetId(sheetUrl);

        console.log("sheetUrl is recieved as ", sheetUrl)
        console.log("Extracted Sheet ID as  ", sheetId)

        if (!sheetUrl) {
            return NextResponse.json({ error: "Missing sheetUrl" }, { status: 400 });
        }

        const sheetUrlForApi = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
        console.log("Built sheetUrlForApi as  ", sheetUrlForApi)

        // ✅ Fetch data with headers to avoid blocking
        const response = await fetch(sheetUrlForApi, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json, text/plain, */*",
            },
        });

        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.statusText}`);
        }
        let textResponse = await response.text();

        // ✅ Remove Google’s security characters `)]}'`
        textResponse = textResponse.replace(/^\)\]\}'/, "");

        // ✅ Extract JSON inside `setResponse(...)`
        const jsonMatch = textResponse.match(/google.visualization.Query.setResponse\((.*)\);?/);
        if (!jsonMatch || jsonMatch.length < 2) {
            throw new Error("Invalid Google Sheets API response format");
        }

        const jsonResponse = JSON.parse(jsonMatch[1]); // ✅ Extract and Parse JSON

        if (!jsonResponse.table || !jsonResponse.table.cols) {
            return NextResponse.json({ error: "No valid data found in the Google Sheet" }, { status: 404 });
        }

        // ✅ Extract headers from the FIRST ROW (instead of empty `cols.label`)
        const headers = jsonResponse.table.rows[0].c.map(cell => cell?.v || "");
        //console.log("headers are read as ", headers)

        // ✅ Convert remaining rows into structured objects
        const formattedData = jsonResponse.table.rows.slice(1).map(row =>
            Object.fromEntries(row.c.map((cell, index) => [headers[index], cell?.v || ""]))
        );

        //console.log("formattedData are read as ", formattedData)

        
        return NextResponse.json({ data: formattedData }, { status: 200 });
    } catch (error) {
        console.error("❌ Google Sheets API Error:", error);
        return NextResponse.json({ error: "Failed to fetch Google Sheet data" }, { status: 500 });
    }
}
