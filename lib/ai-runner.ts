import { ClickUpTask } from "./clickup"

// **Helper: Print and Log All Custom Fields**
const logAllCustomFields = (task: any) => {
    console.log(`📝 Task: ${task.name} (ID: ${task.id}) - Available Custom Fields:`)
    task.custom_fields.forEach((field: any) => {
        console.log(`   - ${field.name}: ${field.value || "N/A"}`)
    });
};

// **Helper: Extract Custom Fields**
const getCustomFieldValue = (task: any, fieldNames: string[]): string | null => {
    const field = task.custom_fields.find((field: any) =>
        fieldNames.includes(field.name.toLowerCase())
    );
    return field?.value || null;
};

const getClientFromTask = async (task: any): Promise<string> => {
    logAllCustomFields(task); // Debugging: Log all fields
    return getCustomFieldValue(task, ["client", "client name", "client-name"]);
};

const getClientSlackFromTask = async (task: any): Promise<string> => {
    return getCustomFieldValue(task, ["slack", "client slack"]);
};

const getClientOnboardingDocFromTask = async (task: any): Promise<string> => {
    return getCustomFieldValue(task, ["onboarding document", "client onboarding doc"]);
};

const getClientLeadsGoogleSheetFromTask = async (task: any): Promise<string> => {
    return getCustomFieldValue(task, ["client-leads-list", "final approved list"]);
};

const getClientGoogleDriveFromTask = async (task: any): Promise<string> => {
    return getCustomFieldValue(task, ["client-google-drive", "google drive link"]);
};

const getClientWebsiteFromTask = async (task: any): Promise<string> => {
    return getCustomFieldValue(task, ["client-website", "website"]);
};


async function fetchAndUpdatePitchMatch(airtableResult: any, documentReadText: any) {
    const pitchMatchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            airtableRecords: airtableResult.storedRecords,
            aiTaskType: "Pitch-Match",
            testDrive: "Yes",
            clientOnboardingDocument: documentReadText
        }),
    });

    // ✅ Handle possible empty response
    if (!pitchMatchResponse.ok) {
        throw new Error(`Server Error: ${pitchMatchResponse.statusText}`);
    }
    const data = await pitchMatchResponse.json();

    // ✅ Check if the response contains expected data
    if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from server");
    }
    //console.log("✅ AI Workflow Results:", data.results);

    // ✅ Step 4: Update the relevent Air Table Record with the AI Generated Pitch
    const recordsToUpdate = data.results.map(record => {
        //console.log("🔍 Full record:", JSON.stringify(record, null, 2));

        const fields: any = {
            status: "processed"
        };

        if (record.pitchMatchSummary != null) fields["pitch-match"] = record.pitchMatchSummary;
        if (record.pitchProductSummary != null) fields["pitch-product"] = record.pitchProductSummary;
        if (record.pitchCtaSummary != null) fields["pitch-cta"] = record.pitchCtaSummary;

        if (record.pitchMatchPrompt != null) fields["pitch-match-prompt"] = record.pitchMatchPrompt;
        if (record.pitchProductPrompt != null) fields["pitch-product-prompt"] = record.pitchProductPrompt;
        if (record.pitchCtaPrompt != null) fields["pitch-cta-prompt"] = record.pitchCtaPrompt;

        return {
            id: record.recordId,
            fields
        };
    });

    //console.log("recordsToUpdate being set as ", recordsToUpdate)

    const airtableUpdatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/airtable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ airtableRecords: recordsToUpdate }),
    });

    const updateResult = await airtableUpdatedResponse.json();
    //console.log("✅ Successfully updated Airtable records:", updateResult);
}


export async function runAIWorkflowOnTask(task: ClickUpTask) {
    console.log(`📡 Processing Task: ${task.name} (ID: ${task.id})`);

    try {

        // ✅ Step 0: Set Click Up task status to AI PROCESSING
        let response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/clickup`, {
            method: "PUT",
            headers: {
                Authorization: `${process.env.CLICKUP_WORKSPACE_TOKEN_FOR_WEBHOOKS}`, 
                Accept: "application/json",
            },
            body: JSON.stringify({ taskId: task.id, status: "AI PROCESSING" }),
        });

        if (!response.ok) {
            console.error(`Failed to update tasks status for : ${task.id} with status: AI PROCESSING`)
        }


        //const clientLeadsGoogleSheetLink = await getClientLeadsGoogleSheetFromTask(task)
        //const clientOnboardingDoc = await getClientOnboardingDocFromTask(task)

        const clientName = await getClientFromTask(task)

        // Make it lowercase and add a hyphen for space. THis is the format in which the folder for each client exists
        const formattedClientName = clientName.toLowerCase().replace(/\s+/g, "-");
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/setup-client?clientName=${encodeURIComponent(formattedClientName)}`);

        if (!response.ok) {
            console.error(`Client Leads and Onboarding doc not available for client name: ${formattedClientName}`)
        }

        const clientArtifacts = await response.json();

        const clientLeads = clientArtifacts.leadsFile
        if (!clientLeads) {
            console.error(`Client Leads not available for client name: ${formattedClientName}`)
        }

        const clientOnboarding = clientArtifacts.onboardingDoc
        if (!clientOnboarding) {
            console.error(`Client Onboarding doc not available for client name: ${formattedClientName}`)
        }

        const clientGoogleDriveLink = await getClientGoogleDriveFromTask(task)
        const clientWebsiteLink = await getClientWebsiteFromTask(task)
        const clientSlack = await getClientSlackFromTask(task)

        console.log(`For Cliennt Name ${clientName}, we have website as ${clientWebsiteLink}, the leads doc link as ${clientLeads} and Onboarding doc link as ${clientOnboarding}`)

        // ✅ Step 1: Read the data from the leads to be later passed to Airtable
        const leadsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/read-leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadsURL: clientLeads }),
        });

        let leads = await leadsResponse.json();
        if (!leadsResponse.ok) throw new Error(leadsResponse.error || "Failed to read the Leads Google Sheet");

        if (!Array.isArray(leads)) {
            console.error("❌ Error: `leads` is not an array. Fixing format...");
            leads = Object.values(leads); // Convert object to array if needed
        }

        //console.log("✅ Google Sheet Data Read as :", leads);

        const onboardingDocResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/read-onboarding-doc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ docURL: clientOnboarding }),
        });

        let documentRead = await onboardingDocResponse.json();
        let documentReadText = documentRead.text

        const body = { data: leads, client: clientName, clientSlack: clientSlack, onboardindDocument: clientOnboarding, clickupTask: task.id }

        // ✅ Step 2: Sending data to Airtable
        console.log("📡 Sending data to Airtable...");

        const airtableResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/airtable`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const airtableResult = await airtableResponse.json();

        if (!airtableResponse.ok) {
            throw new Error(airtableResult.error || "Failed to store data in Airtable");
        }

        console.log("✅ Successfully stored data in Airtable:");

        // ✅ Step 3: Trigger AI Workflow for each Airtable record. 
        // For each wibsite form the AI Built Pitch-Match
        await fetchAndUpdatePitchMatch(airtableResult, documentReadText);


        console.log("🎉 AI workflow completed!")

    } catch (error) {
        console.error("❌ Error triggering AI workflow:", error)
        console.error("❌ AI processing failed")
    }
}