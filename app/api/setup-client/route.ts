import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sanitize from "sanitize-filename";
import fs from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function saveFile(file: File, folderPath: string, fileName: string): Promise<string> {
    const buffer = await file.arrayBuffer();
    const filePath = path.join(folderPath, fileName);

    await writeFile(filePath, Buffer.from(buffer));

    return `/uploads/${path.basename(folderPath)}/${fileName}`; // Return relative URL
}

export async function POST(req: Request) {
    try {
        // Parse form data
        const formData = await req.formData();
        let clientName = formData.get("clientName") as string;
        const leadsFile = formData.get("leadsFile") as File;
        const onboardingDoc = formData.get("onboardingDoc") as File;

        if (!clientName || !leadsFile || !onboardingDoc) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Sanitize client name to avoid invalid folder/file names
        clientName = sanitize(clientName.replace(/\s+/g, "-").toLowerCase());

        // Define client folder path
        const clientFolderPath = path.join(process.cwd(), "public", "uploads", clientName);

        // Create the folder if it doesn't exist
        await mkdir(clientFolderPath, { recursive: true });

        console.log(`📁 Created/Using client folder: ${clientFolderPath}`);

        // Define file names
        const leadsFileName = `${clientName}-leads.${leadsFile.name.split('.').pop()}`;
        const onboardingFileName = `${clientName}-onboarding.${onboardingDoc.name.split('.').pop()}`;

        // Save files inside the client subfolder
        const leadsFilePath = await saveFile(leadsFile, clientFolderPath, leadsFileName);
        const onboardingDocPath = await saveFile(onboardingDoc, clientFolderPath, onboardingFileName);

        console.log("✅ Files saved:", leadsFilePath, onboardingDocPath);

        return NextResponse.json({
            success: true,
            message: "Files uploaded successfully!",
            data: {
                clientName,
                leadsFile: leadsFilePath,
                onboardingDoc: onboardingDocPath,
            },
        });

    } catch (error) {
        console.error("❌ Upload Error:", error);
        return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
    }
}


export async function GET(req: Request) {
    try {
        // Extract client name from query params
        const url = new URL(req.url);
        let clientName = url.searchParams.get("clientName");
        clientName = clientName?.toLowerCase()

        if (!clientName) {
            return NextResponse.json({ error: "Client name is required" }, { status: 400 });
        }

        const clientFolder = path.join(UPLOADS_DIR, clientName);

        if (!fs.existsSync(clientFolder)) {
            return NextResponse.json({ error: "Client folder not found" }, { status: 404 });
        }

        // List all files in the client folder
        const files = fs.readdirSync(clientFolder);

        console.log("All files in client folder are ", files)

        // Match leads file (CSV or Excel)
        const leadsFile = files.find(file =>
            file.startsWith(`${clientName}-leads`) && (file.endsWith(".csv") || file.endsWith(".xls") || file.endsWith(".xlsx"))
        );

        // Match onboarding document (DOC, DOCX, or PDF)
        const onboardingDoc = files.find(file =>
            file.startsWith(`${clientName}-onboarding`) && (file.endsWith(".doc") || file.endsWith(".docx") || file.endsWith(".pdf"))
        );

        return NextResponse.json({
            success: true,
            leadsFile: leadsFile ? `/uploads/${clientName.toLowerCase()}/${leadsFile}` : null,
            onboardingDoc: onboardingDoc ? `/uploads/${clientName.toLowerCase()}/${onboardingDoc}` : null
        });

    } catch (error) {
        console.error("❌ Error fetching client files:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
