/**
 * Minimal, controlled persistence of pre-OAuth state.
 * Uses sessionStorage (tab-scoped, cleared on tab close).
 */

const KEY = "aura_oauth_state";

interface OAuthPreState {
  role: "client" | "professional";
  referral_code: string | null;
}

export function saveOAuthPreState(state: OAuthPreState) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function consumeOAuthPreState(): OAuthPreState | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as OAuthPreState;
  } catch {
    return null;
  }
}
