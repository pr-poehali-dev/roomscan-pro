import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { listProjects, type SavedProject } from "@/lib/projectsStore";
import { formatRub } from "@/lib/estimate";
import { formatRubShort } from "@/lib/staging";

/**
 * Сравнение 2-3 проектов бок о бок.
 * Пользователь выбирает проекты — получает таблицу различий
 * (площадь, тариф, бюджет, срок, прогноз цены).
 */
export default function ProjectsCompare() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const reload = () => setProjects(listProjects());
    reload();
    window.addEventListener("roomscan:projects:changed", reload);
    return () => window.removeEventListener("roomscan:projects:changed", reload);
  }, []);

  const toggleProject = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // максимум 3
      return [...prev, id];
    });
  };

  const compared = useMemo(
    () => selected.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as SavedProject[],
    [selected, projects]
  );

  // Подсветка лучших значений
  const cheapest = useMemo(() => {
    if (compared.length < 2) return null;
    const withEst = compared.filter((p) => p.estimate);
    if (withEst.length < 2) return null;
    return withEst.reduce((min, p) => p.estimate!.grandTotal < min.estimate!.grandTotal ? p : min);
  }, [compared]);

  const fastest = useMemo(() => {
    if (compared.length < 2) return null;
    const withEst = compared.filter((p) => p.estimate);
    if (withEst.length < 2) return null;
    return withEst.reduce((min, p) => p.estimate!.daysApprox < min.estimate!.daysApprox ? p : min);
  }, [compared]);

  if (projects.length < 2) {
    return (
      <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
        <Icon name="GitCompare" size={28} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-foreground">Нужно минимум 2 проекта для сравнения</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Сохраните несколько вариантов сметы (например, в трёх тарифах: Эконом, Стандарт, Премиум)
          — здесь сможете сравнить их бок о бок.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Выберите 2–3 проекта для сравнения
        </p>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => {
            const active = selected.includes(p.id);
            const disabled = !active && selected.length >= 3;
            return (
              <button
                key={p.id}
                onClick={() => toggleProject(p.id)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : disabled
                      ? "bg-card border-border text-muted-foreground/40 cursor-not-allowed"
                      : "bg-card border-border text-foreground hover:border-primary"
                }`}
              >
                {active && <Icon name="Check" size={11} className="inline mr-1" />}
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {compared.length >= 2 && (
        <div className={`grid gap-3 ${compared.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
          {compared.map((p) => (
            <div key={p.id} className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b border-border">
                <p className="font-black text-foreground text-base truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {new Date(p.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </p>
              </div>

              <div className="divide-y divide-border">
                <Row label="Площадь" value={p.scan ? `${p.scan.area.toFixed(1)} м²` : "—"} />
                <Row label="Высота" value={p.scan ? `${p.scan.height.toFixed(2)} м` : "—"} />
                <Row label="Двери / Окна" value={p.scan ? `${p.scan.doors ?? 0} / ${p.scan.windows ?? 0}` : "—"} />

                {p.estimate && (
                  <>
                    <Row label="Тариф" value={
                      p.estimate.tier === "econom" ? "Эконом" :
                      p.estimate.tier === "standart" ? "Стандарт" : "Премиум"
                    } />
                    <Row
                      label="Стоимость"
                      value={formatRub(p.estimate.grandTotal)}
                      highlight={cheapest?.id === p.id ? "win" : undefined}
                      hint={cheapest?.id === p.id ? "Дешевле" : undefined}
                    />
                    <Row
                      label="Срок"
                      value={`~${p.estimate.daysApprox} дней`}
                      highlight={fastest?.id === p.id ? "win" : undefined}
                      hint={fastest?.id === p.id ? "Быстрее" : undefined}
                    />
                    <Row
                      label="Цена за м²"
                      value={p.scan ? formatRub(Math.round(p.estimate.grandTotal / p.scan.area)) : "—"}
                    />
                  </>
                )}

                {p.staging && (
                  <>
                    <Row
                      label="Стейджинг"
                      value={p.staging.goal === "rent" ? "Аренда" : p.staging.goal === "fast_sale" ? "Быстрая продажа" : "Дорогая продажа"}
                    />
                    <Row label="Бюджет подг." value={formatRubShort(p.staging.budget)} />
                    <Row label="Прирост цены" value={`+${p.staging.expectedUplift}%`} highlight="up" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {compared.length === 1 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Выберите ещё минимум один проект, чтобы сравнить
        </p>
      )}
    </div>
  );
}

function Row({
  label, value, highlight, hint,
}: { label: string; value: string; highlight?: "win" | "up"; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        {hint && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            highlight === "win" ? "bg-emerald-500/15 text-emerald-500" :
            highlight === "up"  ? "bg-amber-500/15 text-amber-500" : ""
          }`}>
            ★ {hint}
          </span>
        )}
        <span className={`font-bold font-mono ${
          highlight === "win" ? "text-emerald-500" :
          highlight === "up"  ? "text-amber-500" : "text-foreground"
        }`}>
          {value}
        </span>
      </div>
    </div>
  );
}
