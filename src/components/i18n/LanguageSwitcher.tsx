import { Languages } from "lucide-react";
import { useLang, setLang, useT } from "@/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const lang = useLang();
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8">
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={() => setLang("en")} className={lang === "en" ? "bg-accent" : ""}>
          🇬🇧 {t("english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang("sw")} className={lang === "sw" ? "bg-accent" : ""}>
          🇰🇪 {t("swahili")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
