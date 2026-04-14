import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Desktop dropdown language selector with tooltip */
export function LanguageSelectorDropdown() {
  const { lang, setLang } = useLanguage();
  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded-full h-8 w-8 flex items-center justify-center text-lg leading-none transition-colors hover:bg-accent/35"
              aria-label={`Language: ${currentLang.name}`}
            >
              {currentLang.flag}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {currentLang.name}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`text-sm gap-2 ${lang === l.code ? "bg-accent font-semibold" : ""}`}
          >
            <span className="text-base">{l.flag}</span>
            <span>{l.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile inline flag buttons */
export function LanguageSelectorInline() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 px-2 py-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-full px-2.5 py-1.5 text-base transition-all duration-200 ${
            lang === l.code
              ? "bg-primary/20 ring-1 ring-primary/70 scale-110"
              : "hover:bg-accent/35"
          }`}
          aria-label={l.name}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
