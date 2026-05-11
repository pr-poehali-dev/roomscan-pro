import Icon from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOURCES } from "./types";

/**
 * Таб «Где брать модели» — список внешних источников 3D-моделей + совет про FBX по запросу.
 * Чисто презентационный компонент без бизнес-логики.
 */
export default function ConverterSourcesTab() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className="p-5 h-full hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name={s.icon} size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {s.name}
                    </p>
                    <Icon name="ExternalLink" size={12} className="text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">Бесплатно: {s.free}</Badge>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      <Card className="p-5 mt-4 bg-secondary/40">
        <div className="flex items-start gap-3">
          <Icon name="Lightbulb" size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">Совет</p>
            <p className="text-muted-foreground leading-relaxed">
              Если бренд (например, <a href="https://www.likelodka.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Like Lodka</a>,
              {" "}<a href="https://sarosco.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sarosco</a>
              {" "}или <a href="https://svetholl.ru/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Svetholl</a>) не выкладывает 3D-модели
              публично — напишите им в почту менеджеру: для архитекторов и дизайнеров большинство производителей даёт модели в FBX по запросу.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
