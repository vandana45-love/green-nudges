import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { calculateCarbon, SurveyInput, CarbonBreakdown } from "./carbon";

export interface SurveyDoc extends SurveyInput, CarbonBreakdown {
  createdAt?: unknown;
}

export interface RecommendationItem {
  category: string;
  message: string;
  savingsKg: number;
}

export async function getSurvey(uid: string): Promise<SurveyDoc | null> {
  const snap = await getDoc(doc(db, "surveys", uid));
  return snap.exists() ? (snap.data() as SurveyDoc) : null;
}

export async function saveSurvey(uid: string, input: SurveyInput): Promise<SurveyDoc> {
  const breakdown = calculateCarbon(input);
  const data: SurveyDoc = { ...input, ...breakdown, createdAt: serverTimestamp() };
  await setDoc(doc(db, "surveys", uid), data);
  return data;
}

export async function getRecommendations(uid: string): Promise<RecommendationItem[]> {
  const snap = await getDoc(doc(db, "recommendations", uid));
  if (!snap.exists()) return [];
  return (snap.data().items ?? []) as RecommendationItem[];
}

export async function saveRecommendations(uid: string, items: RecommendationItem[]): Promise<void> {
  await setDoc(doc(db, "recommendations", uid), {
    items,
    generatedAt: serverTimestamp(),
  });
}
