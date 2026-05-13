"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/interview.action";

import ChoiceModal from "@/components/create-interview/ChoiceModal";
import { InterviewFormWizard } from "@/components/create-interview/InterviewFormWizard";
import VoiceCollectView from "@/components/create-interview/VoiceCollectView";
import GeneratingScreen from "@/components/create-interview/GeneratingScreen";
import BreathingScreen from "@/components/create-interview/BreathingScreen";

type Screen =
  | "choice"
  | "form"
  | "voice"
  | "generating"
  | "breathing"
  | "interview";

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-aurora">Preparing interview...</div>}>
      <NewInterviewContent />
    </Suspense>
  );
}

function NewInterviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [screen, setScreen] = useState<Screen>("choice");
  const [role, setRole] = useState("your");
  const [userName, setUserName] = useState("there");
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [interviewId, setInterviewId] = useState<string>(id || "");

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        if (u.name) setUserName(u.name.split(" ")[0]);
        setUserId(u.uid);
      }
    });

    if (id) {
      getInterviewById(id).then((data) => {
        if (data) {
          setRole(data.role || "your");
          setInterviewId(data.id);
          setScreen("breathing");
        } else {
          // If ID is invalid or a mock ID, go back to choice
          setScreen("choice");
        }
      });
    } else {
      setScreen("choice");
    }
  }, [id]);

  const handleFormSubmit = (data: any) => {
    setRole(data?.role || "your");
    setFormData(data);
    setScreen("generating");
  };

  const handleVoiceSubmit = () => {
    setScreen("generating");
  };

  const handleReadyToJoin = (id: string) => {
    setInterviewId(id);
    setScreen("breathing");
  };

  const handleBreathingDone = () => {
    // Navigate to the live interview page
    window.location.href = `/interview${interviewId ? `?id=${interviewId}` : ""}`;
  };

  return (
    <main className="min-h-screen">
      {screen === "choice" && (
        <ChoiceModal
          userName={userName}
          onSelect={(path) => setScreen(path)}
        />
      )}

      {screen === "form" && (
        <InterviewFormWizard
          userName={userName}
          onSubmit={handleFormSubmit}
          onBack={() => setScreen("choice")}
        />
      )}

      {screen === "voice" && (
        <VoiceCollectView
          onSubmit={handleVoiceSubmit}
          onBack={() => setScreen("choice")}
        />
      )}

      {screen === "generating" && (
        <GeneratingScreen
          role={role}
          formData={formData}
          userId={userId}
          onReadyToJoin={handleReadyToJoin}
        />
      )}

      {screen === "breathing" && (
        <BreathingScreen
          durationSeconds={40}
          onComplete={handleBreathingDone}
        />
      )}
    </main>
  );
}
