"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";
import { toast } from "react-toastify";

export default function UploadClientData() {
    const [clientName, setClientName] = useState("");
    const [leadsFile, setLeadsFile] = useState<File | null>(null);
    const [onboardingDoc, setOnboardingDoc] = useState<File | null>(null);
    
    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFile(file);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!clientName || !leadsFile || !onboardingDoc) {
            toast.error("Please fill out all fields and upload required files.");
            return;
        }

        const formData = new FormData();
        formData.append("clientName", clientName);
        formData.append("leadsFile", leadsFile);
        formData.append("onboardingDoc", onboardingDoc);

        try {
            const response = await fetch("/api/setup-client", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            toast.success("Files uploaded successfully!");
        } catch (error) {
            toast.error("Error uploading files.");
            console.error(error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Client Data</CardTitle>
                    <p className="text-sm text-muted-foreground">Provide client details and upload necessary files.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Client Name Input */}
                    <div>
                        <label className="block text-sm font-medium">Client Name</label>
                        <Input
                            type="text"
                            placeholder="Enter client name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                    </div>

                    {/* Upload Leads File (CSV/Excel) */}
                    <div>
                        <label className="block text-sm font-medium">Upload Leads (CSV/Excel)</label>
                        <Input type="file" accept=".csv, .xlsx" onChange={(e) => handleFileChange(e, setLeadsFile)} />
                        {leadsFile && <p className="text-sm text-gray-500 mt-1">Selected: {leadsFile.name}</p>}
                    </div>

                    {/* Upload Onboarding Document */}
                    <div>
                        <label className="block text-sm font-medium">Upload Onboarding Document (PDF/DOCX)</label>
                        <Input type="file" accept=".pdf, .docx" onChange={(e) => handleFileChange(e, setOnboardingDoc)} />
                        {onboardingDoc && <p className="text-sm text-gray-500 mt-1">Selected: {onboardingDoc.name}</p>}
                    </div>

                    {/* Submit Button */}
                    <Button onClick={handleSubmit} variant="primary" className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        Upload Data
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
