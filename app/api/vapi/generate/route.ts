import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { adminDb as db } from "@/firebase/admin";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

export async function GET() {
    return Response.json({ success: true, data: 'THANK YOU!'}, { status: 200 });
}

export async function POST(request: Request) {
    const { companyName, type, role, level, techstack, amount, userid, amountMode, duration, questionCount } = await request.json();

    let amountPrompt = "";
    if (amountMode === "time") {
        amountPrompt = `questions for a ${duration}-minute interview`;
    } else if (amountMode === "questions") {
        amountPrompt = `${questionCount} interview questions`;
    } else {
        amountPrompt = `${amount || 5} interview questions`;
    }

    const levelPrompt = `The candidate's experience level is: ${level}.`;
    const companyPrompt = companyName ? `The interview is being conducted for the company: ${companyName}. Adjust the tone and specificity to match this company's typical interview standards.` : "The company name is not specified; maintain a professional and standard corporate interview tone.";
    const techPrompt = (techstack && (Array.isArray(techstack) ? techstack.length > 0 : techstack.length > 0))
        ? `The candidate has specified the following key skills/technologies: ${Array.isArray(techstack) ? techstack.join(", ") : techstack}. Questions should strictly test proficiency in these areas.` 
        : "No specific technical stack was provided; focus on general role-related concepts, logic, and problem-solving abilities.";

    try {
        const { text: questions } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `You are an elite, world-class interviewer. Your goal is to prepare ${amountPrompt} for a professional job interview.
        
        CONTEXT:
        - Job Role: ${role}
        - ${levelPrompt}
        - ${companyPrompt}
        - ${techPrompt}
        - Focus Areas: ${Array.isArray(type) ? type.join(" & ") : type}

        CRITICAL INSTRUCTIONS:
        1. RELEVANCE: Questions must be highly specific to the role and level. Do not ask generic questions unless no details were provided.
        2. DIVERSITY: Balance the questions across the specified focus areas (e.g., if Technical and Behavioral are selected, provide a mix of both).
        3. NATURAL PHRASING: Questions will be read by a voice assistant. They must sound conversational, clear, and professional.
        4. NO SPECIAL CHARACTERS: Avoid characters like "/", "*", or complex punctuation that might disrupt a text-to-speech engine. Spell out symbols if necessary.
        5. FORMAT: Return ONLY a valid JSON array of strings. No markdown, no pre-amble, no post-amble.
        
        Example: ["Question 1", "Question 2", "Question 3"]
        
        Thank you!
        `,
        });

        // Ensure techstack is an array
        const techstackArray = Array.isArray(techstack) 
            ? techstack 
            : typeof techstack === 'string' ? techstack.split(',').map(s => s.trim()) : [];

        // Ensure type is an array
        const typeArray = Array.isArray(type) 
            ? type 
            : typeof type === 'string' ? type.split(',').map(s => s.trim()) : [];

        let parsedQuestions = [];
        try {
            // Clean up any potential markdown code blocks if the AI hallucinates them
            const cleanText = questions.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedQuestions = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse questions", e, questions);
            // Fallback: try to split by line if JSON parsing fails, simple heuristic
            parsedQuestions = questions.split('\n').map(q => q.replace(/^["'\[\]]+|["'\[\],]+$/g, '').trim()).filter(Boolean);
        }

        const interview = {
            companyName,
            role, 
            type: typeArray, 
            level,
            techstack: techstackArray,
            questions: parsedQuestions,
            userId: userid,
            amountMode,
            duration,
            questionCount,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString()
        }

        await db.collection("interviews").add(interview);

        return Response.json({ success: true}, {status: 200})
    } catch (error) {
        console.error(error);

        return Response.json({ success: false, error }, { status: 500 });
    }
}
