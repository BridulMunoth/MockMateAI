import { adminDb as db } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Vapi sends different types of events. We only care about end-of-call-report
        if (payload?.message?.type === 'end-of-call-report') {
            const call = payload.message.call;
            const variables = call.variableValues || {};
            const interviewId = variables.interviewId;

            if (interviewId && interviewId !== "unknown") {
                const recordingUrl = call.recordingUrl || "";
                const transcript = call.transcript || "No transcript available.";
                let aiAnalysis: any = null;

                try {
                    // 1. Prepare messages for Gemini
                    const messages: any[] = [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "You are an expert HR interviewer and technical evaluator. Listen to this interview recording (or read the transcript if audio is absent). Identify the AI asking questions and the user giving answers. Analyze the user's performance and provide detailed feedback."
                                }
                            ]
                        }
                    ];

                    // 2. Fetch Audio if available
                    if (recordingUrl) {
                        try {
                            const audioRes = await fetch(recordingUrl);
                            if (audioRes.ok) {
                                const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
                                messages[0].content.push({
                                    type: "file" as any,
                                    data: audioBuffer,
                                    mimeType: "audio/wav" // Vapi usually provides wav or mp3
                                });
                            } else {
                                messages[0].content.push({ type: "text", text: `Transcript: ${transcript}` });
                            }
                        } catch (err) {
                            console.warn("Failed to fetch recording, falling back to transcript", err);
                            messages[0].content.push({ type: "text", text: `Transcript: ${transcript}` });
                        }
                    } else {
                        messages[0].content.push({ type: "text", text: `Transcript: ${transcript}` });
                    }

                    // 3. Call Gemini
                    const { object } = await generateObject({
                        model: google("gemini-1.5-flash"),
                        schema: z.object({
                            overallSummary: z.string().describe("Overall Performance Summary: A comprehensive summary of how the candidate did."),
                            technicalScore: z.number().min(0).max(100).describe("Technical Skills Score (0-100)"),
                            communicationScore: z.number().min(0).max(100).describe("Communication Score (0-100)"),
                            confidenceScore: z.number().min(0).max(100).describe("Confidence Score (0-100)"),
                            problemSolvingScore: z.number().min(0).max(100).describe("Problem Solving Score (0-100)"),
                            keyStrengths: z.array(z.string()).describe("List of Key Strengths demonstrated by the candidate"),
                            areasForImprovement: z.array(z.string()).describe("List of Areas for Improvement or Improvement Scope"),
                            recommendedTopics: z.array(z.string()).describe("Recommended Topics to Practice based on weaknesses"),
                            actionableTips: z.array(z.string()).describe("Actionable Tips and Tricks or Ways to Improve for future interviews"),
                            hiringRecommendation: z.string().describe("Final Hiring Recommendation: e.g., Strong Hire, Hire, Leaning Hire, No Hire"),
                            overallScore: z.number().min(0).max(100).describe("A final weighted overall score out of 100")
                        }),
                        messages: messages
                    });
                    
                    aiAnalysis = object;
                } catch (error) {
                    console.error("Gemini Analysis failed:", error);
                    // Fallback mock scores if Gemini fails completely
                    aiAnalysis = {
                        overallSummary: call.summary || "No feedback generated.",
                        overallScore: 50,
                        technicalScore: 50,
                        communicationScore: 50,
                        confidenceScore: 50,
                        problemSolvingScore: 50,
                        keyStrengths: [],
                        areasForImprovement: [],
                        recommendedTopics: [],
                        actionableTips: [],
                        hiringRecommendation: "Needs Review"
                    };
                }

                const score = aiAnalysis.overallScore;

                // 1. Create a new Feedback document
                const feedbackRef = db.collection("feedbacks").doc();
                await feedbackRef.set({
                    interviewId: interviewId,
                    userId: variables.userid || variables.userId || "anonymous",
                    transcript: transcript,
                    recordingUrl: recordingUrl,
                    score: score,
                    summary: aiAnalysis.overallSummary,
                    technicalScore: aiAnalysis.technicalScore,
                    communicationScore: aiAnalysis.communicationScore,
                    confidenceScore: aiAnalysis.confidenceScore,
                    problemSolvingScore: aiAnalysis.problemSolvingScore,
                    keyStrengths: aiAnalysis.keyStrengths,
                    areasForImprovement: aiAnalysis.areasForImprovement,
                    recommendedTopics: aiAnalysis.recommendedTopics,
                    actionableTips: aiAnalysis.actionableTips,
                    hiringRecommendation: aiAnalysis.hiringRecommendation,
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

                // Bust cache so dashboard shows updated score immediately
                const userId = variables.userid || variables.userId;
                if (userId) {
                    const { revalidateTag } = await import("next/cache");
                    revalidateTag(`interviews-${userId}`, "");
                }

                console.log(`Successfully saved rich feedback ${feedbackRef.id} for interview: ${interviewId}`);
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
