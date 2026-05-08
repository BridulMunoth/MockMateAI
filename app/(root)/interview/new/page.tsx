"use client";

import { useState, Suspense } from "react";
import { useEffect } from "react";
import { getCurrentUser } from "@/lib/actions/auth.action";

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
  const [screen, setScreen] = useState<Screen>("choice");
  const [role, setRole] = useState("your");
  const [userName, setUserName] = useState("there");
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        if (u.name) setUserName(u.name.split(" ")[0]);
        setUserId(u.uid);
      }
    });
  }, []);

  const handleFormSubmit = (data: any) => {
    setRole(data?.role || "your");
    setFormData(data);
    setScreen("generating");
  };

  const handleVoiceSubmit = () => {
    setScreen("generating");
  };

  const handleReadyToJoin = () => {
    setScreen("breathing");
  };

  const handleBreathingDone = () => {
    // Navigate to the live interview page
    window.location.href = "/interview";
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
