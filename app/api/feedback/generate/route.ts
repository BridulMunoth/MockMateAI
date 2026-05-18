import { adminDb as db } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { interviewId, userId, transcript } = await req.json();

        if (!interviewId) {
            return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
        }

        if (!transcript || transcript.trim().length < 15) {
            return NextResponse.json({ 
                error: "Transcript is empty or too short. Please speak during the interview to generate feedback." 
            }, { status: 400 });
        }

        // Fetch interview document
        const docRef = db.collection("interviews").doc(interviewId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const interviewData = doc.data();

        // Prepare rich evaluation prompt
        const prompt = `
You are an expert HR interviewer and senior technical evaluator.
You have just conducted a mock interview for the role of "${interviewData?.role || "Software Engineer"}" at "${interviewData?.companyName || "a company"}".
The candidate's target skill level is: ${interviewData?.level || "mid-level"}.
The target technologies and tools are: ${interviewData?.techstack?.join(", ") || "general software engineering"}.
The type of interview is: ${Array.isArray(interviewData?.type) ? interviewData.type.join(", ") : interviewData?.type || "technical"}.

Candidate Profile Context (incorporate this context to evaluate if their responses match these parameters):
- Resume / CV Text: ${interviewData?.resumeText || "No resume provided."}
- Job Description (JD): ${interviewData?.jdText || "No job description provided."}
- Prep / Focus Material: ${interviewData?.prepText || "No prep material provided."}

Here is the exact transcript of the interview. Analyze it carefully:
${transcript}

Please identify the AI asking questions and the candidate giving answers.
Evaluate the candidate's performance based on their responses. Analyze:
1. Technical depth and accuracy based on their target technologies.
2. Communication clarity, structure, and pacing.
3. Confidence and professionalism.
4. Problem solving ability.

Provide a complete, rich, detailed, and constructive feedback report using the required JSON schema.
`;

        // Call Gemini
        const { object: aiAnalysis } = await generateObject({
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
            prompt: prompt
        });

        const score = aiAnalysis.overallScore;

        // 1. Create a new Feedback document
        const feedbackRef = db.collection("feedbacks").doc();
        await feedbackRef.set({
            interviewId: interviewId,
            userId: userId || interviewData?.userId || "anonymous",
            transcript: transcript,
            recordingUrl: "",
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

        // 2. Update the parent Interview document
        await docRef.update({
            latestScore: score,
            latestAttemptAt: new Date().toISOString(),
            status: "ended",
        });

        // 3. Bust cache
        const finalUserId = userId || interviewData?.userId;
        if (finalUserId) {
            try {
                const { revalidateTag } = await import("next/cache");
                revalidateTag(`interviews-${finalUserId}`, "");
                console.log(`[Feedback Generator] Cache busted for user: ${finalUserId}`);
            } catch (err) {
                console.warn("[Feedback Generator] Cache revalidation failed");
            }
        }

        return NextResponse.json({ success: true, feedbackId: feedbackRef.id, score });
    } catch (error: any) {
        console.error("Feedback Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate feedback report" }, { status: 500 });
    }
}
