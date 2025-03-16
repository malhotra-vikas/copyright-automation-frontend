import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync"; // ✅ Library to parse CSV files

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; // Ensure a valid API key

/**
 * Extracts the file ID from a Google Drive or Google Sheets URL.
 */
const extractFileId = (url: string): string | null => {
    const match = url.match(/\/d\/([^/]+)/);
    return match ? match[1] : null;
};

/**
 * Fetches file metadata from Google Drive to determine the file type.
 */
const getFileMetadata = async (fileId: string) => {
    try {
        const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,exportLinks,webContentLink&key=${GOOGLE_API_KEY}`;
        const response = await fetch(driveApiUrl);
        const data = await response.json();

        console.log("📡 Google Drive API Response:", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching file metadata from Google Drive:", error);
        return null;
    }
};

/**
 * Fetches and parses a CSV file from Google Drive.
 */
const fetchCSVFile = async (downloadUrl: string) => {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download CSV file: ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log("✅ CSV file downloaded, parsing...");

        // ✅ Parse CSV content into JSON
        const records = parse(csvText, {
            columns: true, // Use first row as headers
            skip_empty_lines: true,
        });

        console.log("✅ Parsed CSV records:", records.length);
        return records;
    } catch (error) {
        console.error("❌ Error processing CSV file:", error);
        return null;
    }
};

/**
 * Determines the correct API URL for fetching Google Sheet data.
 */
const getSheetApiUrl = async (sheetUrl: string): Promise<{ type: string; url: string | null }> => {
    if (sheetUrl.includes("docs.google.com/spreadsheets")) {
        // ✅ Direct Google Sheets URL
        const sheetId = extractFileId(sheetUrl);
        return {
            type: "sheets",
            url: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json` : null,
        };
    } else if (sheetUrl.includes("drive.google.com/file/d/")) {
        // ✅ Drive File URL, determine file type
        const fileId = extractFileId(sheetUrl);
        if (!fileId) return { type: "unknown", url: null };

        const metadata = await getFileMetadata(fileId);
        if (!metadata) return { type: "unknown", url: null };

        if (metadata.mimeType === "application/vnd.google-apps.spreadsheet") {
            // ✅ Google Sheets File
            return {
                type: "sheets",
                url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:json`,
            };
        } else if (metadata.mimeType === "text/csv") {
            // ✅ CSV File
            const downloadUrl = metadata.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;
            return { type: "csv", url: downloadUrl };
        } else {
            console.error("❌ Unsupported file type:", metadata.mimeType);
            return { type: "unknown", url: null };
        }
    } else {
        console.error("❌ Invalid URL format. Unable to determine file type.");
        return { type: "unknown", url: null };
    }
};

export async function POST(req: Request) {
    try {
        const { sheetUrl } = await req.json();

        console.log("✅ Received sheetUrl:", sheetUrl);
        if (!sheetUrl) {
            return NextResponse.json({ error: "Missing sheetUrl" }, { status: 400 });
        }

        // ✅ Get the correct API URL and type
        const { type, url } = await getSheetApiUrl(sheetUrl);
        if (!url) {
            return NextResponse.json({ error: "Invalid or unsupported file type" }, { status: 400 });
        }

        console.log("✅ Processing file as:", type, "| URL:", url);

        if (type === "sheets") {
            // ✅ Fetch and process Google Sheet
            const response = await fetch(url, {
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
            textResponse = textResponse.replace(/^\)\]\}'/, ""); // Remove Google's security characters

            // ✅ Extract JSON from `setResponse(...)`
            const jsonMatch = textResponse.match(/google.visualization.Query.setResponse\((.*)\);?/);
            if (!jsonMatch || jsonMatch.length < 2) {
                throw new Error("Invalid Google Sheets API response format");
            }

            const jsonResponse = JSON.parse(jsonMatch[1]);
            if (!jsonResponse.table || !jsonResponse.table.cols) {
                return NextResponse.json({ error: "No valid data found in the Google Sheet" }, { status: 404 });
            }

            // ✅ Extract headers from the FIRST ROW
            const headers = jsonResponse.table.rows[0].c.map(cell => cell?.v || "");

            // ✅ Convert remaining rows into structured objects
            const formattedData = jsonResponse.table.rows.slice(1).map(row =>
                Object.fromEntries(row.c.map((cell, index) => [headers[index], cell?.v || ""]))
            );

            console.log("✅ Processed Google Sheets Data:", formattedData.length, "records");

            return NextResponse.json({ data: formattedData }, { status: 200 });
        } else if (type === "csv") {
            // ✅ Fetch and process CSV file
            const csvData = await fetchCSVFile(url);
            if (!csvData) {
                return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 });
            }

            return NextResponse.json({ data: csvData }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }
    } catch (error) {
        console.error("❌ Google Sheets API Error:", error);
        return NextResponse.json({ error: "Failed to fetch file data" }, { status: 500 });
    }
}
