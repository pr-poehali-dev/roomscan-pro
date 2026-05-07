import Icon from "@/components/ui/icon";

/**
 * Переключатель вкладок планировщика: «Редактор» (новый) / «Демо» (старый).
 * Логика и стили 1:1 перенесены из PlannerSection.tsx без изменений.
 */
export default function PlannerTabs({
  tab,
  onChange,
}: {
  tab: "editor" | "demo";
  onChange: (t: "editor" | "demo") => void;
}) {
  const items: { id: "editor" | "demo"; label: string; icon: string }[] = [
    { id: "editor", label: "Редактор", icon: "PenTool" },
    { id: "demo", label: "Демо", icon: "LayoutGrid" },
  ];
  return (
    <div className="inline-flex bg-secondary rounded-lg p-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            tab === it.id ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon name={it.icon} size={13} />
          {it.label}
        </button>
      ))}
    </div>
  );
}
