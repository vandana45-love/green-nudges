/**
 * All requests include the Clerk session JWT as a Bearer token.
 * The FastAPI backend verifies this token and extracts the user ID server-side —
 * the frontend never passes clerk_id in the body or URL.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authFetch(url: string, token: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function fetchMonthly(token: string) {
  const res = await authFetch(`${API}/carbon/monthly`, token);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchRecommendations(token: string) {
  const res = await authFetch(`${API}/recommendations/me`, token);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSurvey(token: string) {
  const res = await authFetch(`${API}/survey/me`, token);
  if (!res.ok) return null;
  return res.json();
}

export async function submitSurvey(token: string, body: object) {
  const res = await authFetch(`${API}/survey`, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Survey submission failed");
  return res.json();
}
