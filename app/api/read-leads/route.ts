import { NextResponse } from "next/server";
import fs from "fs-extra"; // ✅ File System Helper
import path from "path";
import { parse } from "csv-parse/sync"; // ✅ CSV Parser
import * as XLSX from "xlsx"; // ✅ Excel Parser

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads"); // Root directory for uploaded files

/**
 * Reads and parses a CSV file.
 */
const readCSVFile = async (filePath: string) => {
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");

        // ✅ Parse CSV content into JSON
        const records = parse(fileContent, {
            columns: true, // Use first row as headers
            skip_empty_lines: true,
        });

        console.log("✅ Parsed CSV records:", records.length);
        return records;
    } catch (error) {
        console.error("❌ Error reading CSV file:", error);
        return null;
    }
};

/**
 * Reads and parses an Excel file (.xls, .xlsx).
 */
const readExcelFile = async (filePath: string) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0]; // Read the first sheet
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log("✅ Parsed Excel records:", jsonData.length);
        return jsonData;
    } catch (error) {
        console.error("❌ Error reading Excel file:", error);
        return null;
    }
};

/**
 * Handles API request to read and parse uploaded leads file.
 */
export async function POST(req: Request) {
    try {
        const { leadsURL } = await req.json();

        console.log("✅ Received leadsURL:", leadsURL);

        if (!leadsURL) {
            return NextResponse.json({ error: "Missing file path" }, { status: 400 });
        }

        // 🔹 **Ensure the path does not include `/uploads/`**
        const cleanedFilePath = leadsURL.replace(/^\/?uploads\//, ""); // Remove /uploads prefix if present
        const absolutePath = path.join(UPLOADS_DIR, cleanedFilePath);

        console.log("✅ Cleaned file path:", cleanedFilePath);
        console.log("✅ Resolved absolute path:", absolutePath);

        // ✅ Ensure file exists using async `fs.promises.stat`
        try {
            await fs.promises.stat(absolutePath);
        } catch {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        console.log("✅ Processing file:", absolutePath);

        let parsedData;

        // ✅ Determine file type and process accordingly
        if (cleanedFilePath.endsWith(".csv")) {
            parsedData = await readCSVFile(absolutePath);
        } else if (cleanedFilePath.endsWith(".xlsx") || cleanedFilePath.endsWith(".xls")) {
            parsedData = await readExcelFile(absolutePath);
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        if (!parsedData) {
            return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
        }

        return NextResponse.json({ data: parsedData }, { status: 200 });
    } catch (error) {
        console.error("❌ File Processing Error:", error);
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }
}
