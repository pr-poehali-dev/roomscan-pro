import Icon from "@/components/ui/icon";
import { getSectionSEO, type SectionId } from "@/lib/seo";

interface Props {
  activeSection: string;
  onNavigate?: (section: SectionId) => void;
}

/**
 * Хлебные крошки в шапке: АВАНГАРД / RoomScan AI / [Текущий раздел]
 * Учитывают семантику <nav aria-label="breadcrumb">.
 */
export default function Breadcrumbs({ activeSection, onNavigate }: Props) {
  const seo = getSectionSEO(activeSection);
  const isHome = activeSection === "home";

  return (
    <nav
      aria-label="breadcrumb"
      className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground"
    >
      <a
        href="https://avangard-ai.ru"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors flex items-center gap-1"
      >
        <Icon name="Zap" size={11} className="text-primary" />
        АВАНГАРД
      </a>
      <span className="text-border">/</span>

      {isHome ? (
        <span className="text-foreground" aria-current="page">
          RoomScan AI
        </span>
      ) : (
        <>
          <button
            onClick={() => onNavigate?.("home")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            RoomScan AI
          </button>
          <span className="text-border">/</span>
          <span className="text-foreground flex items-center gap-1.5" aria-current="page">
            <Icon name={seo.icon} size={11} className="text-primary" />
            {seo.label}
          </span>
        </>
      )}
    </nav>
  );
}
