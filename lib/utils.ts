import { mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";
const SIMPLEICONS_BASE = "https://cdn.simpleicons.org";

/** Maps a raw skill/tech string to its Devicon key, or returns null if unknown */
const normalizeTechName = (tech: string): string | null => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return (mappings as Record<string, string>)[key] ?? null;
};

const checkIconExists = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
};

/** Resolves the best available icon URL for a skill name. Falls back gracefully. */
const resolveIconURL = async (tech: string): Promise<string> => {
  const normalized = normalizeTechName(tech);

  if (normalized) {
    // 1. Try Devicon original
    const original = `${DEVICON_BASE}/${normalized}/${normalized}-original.svg`;
    if (await checkIconExists(original)) return original;

    // 2. Try Devicon plain
    const plain = `${DEVICON_BASE}/${normalized}/${normalized}-plain.svg`;
    if (await checkIconExists(plain)) return plain;
  }

  // 3. Try Simple Icons (great for non-tech brands and tools)
  const simpleSlug = tech.toLowerCase().replace(/\s+/g, "").replace(/\.js$/, "");
  const simpleIcon = `${SIMPLEICONS_BASE}/${simpleSlug}`;
  if (await checkIconExists(simpleIcon)) return simpleIcon;

  // 4. Final fallback — a colored letter avatar via UI Avatars
  const encoded = encodeURIComponent(tech.slice(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${encoded}&background=6d28d9&color=fff&size=28&bold=true&rounded=true&format=svg`;
};

export const getTechLogos = async (techArray: string[]) => {
  const results = await Promise.all(
    techArray.map(async (tech) => ({
      tech,
      url: await resolveIconURL(tech),
    }))
  );
  return results;
};

export const getRandomInterviewCover = (): string => {
  const covers = [
    "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1557682260-96773eb01377?auto=format&fit=crop&q=80&w=1000"
  ];
  return covers[Math.floor(Math.random() * covers.length)];
};
