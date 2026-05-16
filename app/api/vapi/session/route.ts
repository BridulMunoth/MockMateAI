import { adminDb as db } from "@/firebase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/vapi/session
 * Saves interview session metadata (startedAt, endedAt, duration, questions) 
 * to the interview document after a call ends.
 */
export async function POST(req: Request) {
    try {
        const { interviewId, startedAt, endedAt, durationSeconds, questionsCovered } = await req.json();

        if (!interviewId) {
            return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });
        }

        const docRef = db.collection("interviews").doc(interviewId);
        const doc = await docRef.get();
        if (!doc.exists) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const interviewData = doc.data();
        const userId = interviewData?.userId;

        const { FieldValue } = require("firebase-admin/firestore");

        await docRef.update({
            // Session log — each attempt appends to an array
            sessionLogs: FieldValue.arrayUnion({
                startedAt:        startedAt        || null,
                endedAt:          endedAt          || null,
                durationSeconds:  durationSeconds  || 0,
                questionsCovered: questionsCovered || 0,
                recordedAt:       new Date().toISOString(),
            }),
            // Quick-access flat fields for dashboard display
            lastSessionAt:       endedAt          || new Date().toISOString(),
            lastDurationSeconds: durationSeconds  || 0,
            attemptCount:        FieldValue.increment(1), // ✅ Ensure card shows as 'Taken'
        });

        // ── ⚡ REVALIDATE CACHE ──────────────────────────────────────────────
        // Bust the server-side cache for this specific user so the dashboard 
        // updates 'Not taken' -> 'Completed' immediately.
        if (userId) {
            try {
                const { revalidateTag } = await import("next/cache");
                revalidateTag(`interviews-${userId}`);
                console.log(`[Session] Cache busted for user: ${userId}`);
            } catch (err) {
                console.warn("[Session] Cache revalidation failed (expected in some environments)");
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session save error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
