import Icon from "@/components/ui/icon";
import { HOUSE_PROJECTS } from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";

interface Props {
  projectIdx: number;
  setProjectIdx: (i: number) => void;
  setSelectedModuleIndex: (i: number | null) => void;
  setLoadedId: (id: number | null) => void;
}

/**
 * Сетка из 8 карточек готовых проектов домов.
 * Видна только в режиме «catalog».
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export default function HousesCatalogGrid({
  projectIdx,
  setProjectIdx,
  setSelectedModuleIndex,
  setLoadedId,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
      {HOUSE_PROJECTS.map((p, i) => (
        <button
          key={p.id}
          onClick={() => {
            setProjectIdx(i);
            setSelectedModuleIndex(null);
            setLoadedId(null);
          }}
          className={`text-left p-3 rounded-xl border-2 transition-all ${
            i === projectIdx
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                i === projectIdx ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              <Icon name={p.icon} size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {p.area} м² · {p.bedrooms || 0} спален
              </p>
            </div>
          </div>
          <p className="text-sm font-bold truncate">{p.name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{p.tagline}</p>
          <p className="text-xs font-bold text-primary font-mono mt-2">
            от {formatRub(p.basePrice)}
          </p>
        </button>
      ))}
    </div>
  );
}
