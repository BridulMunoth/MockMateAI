import { adminDb as db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function GET() {
    return Response.json({ success: true, data: 'THANK YOU!'}, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const { companyName, type, role, level, techstack, amount, userid, amountMode, duration, questionCount } = await request.json();

        // Ensure techstack is an array
        const techstackArray = Array.isArray(techstack) 
            ? techstack 
            : typeof techstack === 'string' ? techstack.split(',').map((s: string) => s.trim()) : [];

        // Ensure type is an array
        const typeArray = Array.isArray(type) 
            ? type 
            : typeof type === 'string' ? type.split(',').map((s: string) => s.trim()) : [];

        // We are no longer generating questions via Gemini here.
        // Instead, the Vapi assistant will handle the interview flow dynamically based on these parameters.
        const interview = {
            companyName: companyName || "",
            role: role || "", 
            type: typeArray, 
            level: level || "",
            techstack: techstackArray,
            questions: [], // Handled by Vapi assistant
            userId: userid || "",
            amountMode: amountMode || "questions",
            duration: duration || 30,
            questionCount: questionCount || amount || 5,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString()
        }

        const docRef = await db.collection("interviews").add(interview);

        return Response.json({ success: true, interviewId: docRef.id }, {status: 200})
    } catch (error) {
        console.error(error);
        return Response.json({ success: false, error }, { status: 500 });
    }
}
