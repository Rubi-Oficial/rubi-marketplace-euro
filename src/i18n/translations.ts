import type { TranslationMap } from "./types";
import pt from "./locales/pt";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";

export const LANGUAGES = [
  { code: "pt", label: "PT", flag: "🇧🇷", name: "Português" },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export type { TranslationMap };

export const translations: Record<LangCode, TranslationMap> = { pt, en, es, fr, de };
