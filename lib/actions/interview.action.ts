'use server'

import { adminDb as db } from "@/firebase/admin";

/**
 * ==========================================
 * FETCH INTERVIEW BY ID (SERVER ONLY)
 * ==========================================
 * Bypasses client-side security rules to safely fetch interview details.
 */
export async function getInterviewById(id: string) {
    try {
        if (!id) return null;
        
        const docRef = db.collection("interviews").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        const data = docSnap.data();
        
        // Return serializable data — use explicit shape for type safety
        return {
            id: docSnap.id,
            role: (data?.role as string) || "",
            type: data?.type || [],
            techstack: data?.techstack || [],
            companyName: data?.companyName || "",
            level: data?.level || "",
            createdAt: data?.createdAt || null,
            ...(data as Record<string, any>),
        };
    } catch (error) {
        console.error("Error fetching interview:", error);
        return null;
    }
}
