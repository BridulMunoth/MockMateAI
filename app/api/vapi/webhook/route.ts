import { adminDb as db } from "@/firebase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Vapi sends different types of events. We only care about end-of-call-report
        if (payload?.message?.type === 'end-of-call-report') {
            const call = payload.message.call;
            const variables = call.variableValues || {};
            const interviewId = variables.interviewId;

            if (interviewId && interviewId !== "unknown") {
                const summary = call.summary || "No feedback generated.";
                const transcript = call.transcript || "";
                
                // Try to extract a score out of 100 from the summary text (e.g. "85/100")
                const scoreMatch = summary.match(/(\d{1,3})\s*\/\s*100/);
                let score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
                
                // Fallback score calculation if AI didn't provide one
                if (score === null) {
                    const durationMins = call.duration ? call.duration / 60 : 0;
                    const wordCount = transcript.split(/\s+/).length;
                    // Mock calculation based on length/duration for realism
                    score = Math.floor(Math.min(95, Math.max(45, 50 + (durationMins * 2) + (wordCount / 50))));
                }

                // 1. Create a new Feedback document
                const feedbackRef = db.collection("feedbacks").doc();
                await feedbackRef.set({
                    interviewId: interviewId,
                    userId: variables.userid || variables.userId || "anonymous",
                    summary: summary,
                    transcript: transcript,
                    recordingUrl: call.recordingUrl || "",
                    score: score,
                    createdAt: new Date().toISOString()
                });

                // 2. Update the parent Interview document for quick Dashboard rendering
                const FieldValue = require("firebase-admin/firestore").FieldValue;
                await db.collection("interviews").doc(interviewId).update({
                    latestScore: score,
                    latestAttemptAt: new Date().toISOString(),
                    attemptCount: FieldValue.increment(1),
                    status: call.status || "ended",
                });
                
                console.log(`Successfully saved feedback ${feedbackRef.id} for interview: ${interviewId}`);
            } else {
                console.warn("Received end-of-call report without an interviewId.");
            }
        }

        // If Vapi sends an assistant-request to the Server URL, it expects a configuration object.
        // Returning an empty object tells Vapi to just use the Dashboard settings.
        if (payload?.message?.type === 'assistant-request') {
            return NextResponse.json({
                assistant: {} 
            }, { status: 200 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
