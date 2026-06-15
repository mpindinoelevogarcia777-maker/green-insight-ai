import { useEffect, useState } from "react";

export type MediaItem = {
  id: string;
  title: string;
  image: string; // URL da capa/imagem
  audio?: string; // URL opcional do áudio
  redirect?: string; // URL externa de redirecionamento (clicável)
  placement: "header" | "footer" | "both";
};

export type SiteSettings = {
  siteName: string;
  headerText: string;
  footerText: string;
  primaryColor: string; // oklch ou hex
  accentColor: string;
  backgroundColor: string;
  media: MediaItem[];
};

const STORAGE_KEY = "maisde1green.settings.v1";
const ADMIN_AUTH_KEY = "maisde1green.admin.auth";
export const ADMIN_EMAIL = "palpitesemlimite@gmail.com";
export const AFRICELL_NUMBER = "+244957638668";

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Mais de 1 green",
  headerText: "IA de análise desportiva",
  footerText:
    "Mais de 1 green · IA de análise desportiva · As estimativas são informativas e não constituem aconselhamento de apostas.",
  primaryColor: "#22c55e",
  accentColor: "#16a34a",
  backgroundColor: "#0a0f0a",
  media: [],
};

export function loadSettings(): SiteSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed, media: parsed.media ?? [] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: SiteSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("site-settings:update", { detail: s }));
  applyThemeVars(s);
}

export function applyThemeVars(s: SiteSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", s.primaryColor);
  root.style.setProperty("--primary-glow", s.accentColor);
  root.style.setProperty("--accent", s.accentColor);
  // background é cuidadoso — só aplicamos se o user editar explicitamente
  if (s.backgroundColor) root.style.setProperty("--background-override", s.backgroundColor);
}

export function useSiteSettings(): [SiteSettings, (next: SiteSettings) => void] {
  const [state, setState] = useState<SiteSettings>(() => loadSettings());

  useEffect(() => {
    applyThemeVars(state);
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<SiteSettings>).detail;
      if (detail) setState(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(loadSettings());
    };
    window.addEventListener("site-settings:update", onUpdate as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("site-settings:update", onUpdate as EventListener);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (next: SiteSettings) => {
    setState(next);
    saveSettings(next);
  };
  return [state, update];
}

// --- Admin auth (validação local simples por e-mail) ---
export function isAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_AUTH_KEY) === "1";
}
export function adminLogin(email: string): boolean {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) return false;
  window.localStorage.setItem(ADMIN_AUTH_KEY, "1");
  return true;
}
export function adminLogout() {
  window.localStorage.removeItem(ADMIN_AUTH_KEY);
}

export function safeExternalUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
