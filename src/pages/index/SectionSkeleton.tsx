/** Лёгкий fallback на время подгрузки секции */
export default function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Загрузка раздела">
      <div className="h-8 w-1/3 bg-secondary rounded-lg" />
      <div className="h-4 w-2/3 bg-secondary rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="h-40 bg-secondary rounded-xl" />
        <div className="h-40 bg-secondary rounded-xl" />
        <div className="h-40 bg-secondary rounded-xl" />
      </div>
      <span className="sr-only">Загружаем раздел…</span>
    </div>
  );
}
