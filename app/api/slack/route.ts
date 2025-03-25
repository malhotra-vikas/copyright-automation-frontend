// pages/api/slack/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface SlackAttachment {
    fallback: string;
    text: string;
    color: string;
}

interface SlackMessage {
    text: string;
    attachments: SlackAttachment[];
}

export async function POST(req: NextRequest) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL; // Make sure to add this to your .env.local file

    if (!slackWebhookUrl) {
        return NextResponse.json({ error: 'Slack Webhook URL is not configured' }, { status: 500 });
    }

    try {
        const body = await req.json(); // Parse the incoming request body

        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body), // Using the request body as passed from the frontend
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return NextResponse.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Error sending message to Slack' }, { status: 500 });
    }
}

