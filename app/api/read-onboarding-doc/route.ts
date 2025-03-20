import { NextResponse } from "next/server";
import fs from "fs-extra"; // ✅ File System Helper
import path from "path";
import mammoth from "mammoth";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads"); // Root directory for uploaded files

const readDocxFile = async (filePath: string): Promise<string | null> => {
    try {
        // Read the file as a buffer
        const fileBuffer = await fs.promises.readFile(filePath);

        // Convert buffer to text using `mammoth`
        const { value: textContent } = await mammoth.extractRawText({ buffer: fileBuffer });

        if (!textContent) {
            console.error("❌ No text found in DOCX file.");
            return null;
        }
        // Remove all newline characters
        const cleanedText = textContent.replace(/\n/g, " ");


        console.log("✅ Extracted DOCX text:", cleanedText.slice(0, 100)); // Show first 100 chars

        return cleanedText.trim();
    } catch (error) {
        console.error("❌ DOCX extraction failed:", error);
        return null;
    }
};

/**
 * Extracts plain text from the raw XML structure of a DOCX document.
 */
const extractTextFromXML = (xmlString: string): string => {
    return xmlString
        .replace(/<\/w:p>/g, "\n") // Add line breaks between paragraphs
        .replace(/<[^>]+>/g, "");  // Remove all XML tags
};

/**
 * Handles API request to read and parse uploaded onboarding doc.
 */
export async function POST(req: Request) {
    try {
        const { docURL } = await req.json();
        console.log("✅ Received docURL:", docURL);

        if (!docURL) {
            return NextResponse.json({ error: "Missing file path" }, { status: 400 });
        }

        const cleanedFilePath = docURL.replace(/^\/?uploads\//, ""); // Remove /uploads prefix if present
        const absolutePath = path.join(UPLOADS_DIR, cleanedFilePath);

        console.log("✅ Resolved absolute path:", absolutePath);

        try {
            await fs.promises.stat(absolutePath);
        } catch {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        console.log("✅ Processing file:", absolutePath);

        let extractedText: string | null = null;
        if (cleanedFilePath.endsWith(".docx")) {
            extractedText = await readDocxFile(absolutePath);
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        if (!extractedText) {
            return NextResponse.json({ error: "Failed to extract document text" }, { status: 500 });
        }

        return NextResponse.json({ text: extractedText }, { status: 200 });
    } catch (error) {
        console.error("❌ Document Processing Error:", error);
        return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
    }
}
