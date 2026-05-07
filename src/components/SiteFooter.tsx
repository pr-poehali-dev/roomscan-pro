import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

/**
 * Подвал сайта с реквизитами правообладателя.
 * Показывает копирайт, реквизиты ООО МАТ-Лабс и ссылки на ключевые разделы.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-card/50 backdrop-blur-sm mt-12"
      role="contentinfo"
      itemScope
      itemType="https://schema.org/Organization"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Бренд и описание */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon name="ScanLine" size={16} className="text-primary" />
              </div>
              <p className="font-black text-foreground text-sm uppercase tracking-wider">
                RoomScan AI
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              3D-сканирование комнаты, онлайн-планировщик квартиры,
              AI-смета ремонта и хоумстейджинг — в одном сервисе.
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Часть экосистемы{" "}
              <a
                href="https://avangard-ai.ru"
                className="hover:text-primary transition-colors"
                rel="noopener"
                target="_blank"
              >
                АВАНГАРД
              </a>
            </p>
          </div>

          {/* Разделы */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Разделы
            </p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#scan" className="text-foreground hover:text-primary transition-colors">3D-сканирование</a></li>
              <li><a href="#planner" className="text-foreground hover:text-primary transition-colors">Планировщик</a></li>
              <li><a href="#calc" className="text-foreground hover:text-primary transition-colors">Калькулятор сметы</a></li>
              <li><a href="#staging" className="text-foreground hover:text-primary transition-colors">Хоумстейджинг</a></li>
              <li><a href="#catalog" className="text-foreground hover:text-primary transition-colors">Каталог мебели</a></li>
            </ul>
          </div>

          {/* Документы */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Документы
            </p>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/legal/privacy" className="text-foreground hover:text-primary transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="text-foreground hover:text-primary transition-colors">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-foreground hover:text-primary transition-colors">
                  Политика cookie
                </Link>
              </li>
              <li>
                <Link to="/legal/consent" className="text-foreground hover:text-primary transition-colors">
                  Согласие на обработку ПД
                </Link>
              </li>
            </ul>
          </div>

          {/* Реквизиты правообладателя */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Правообладатель
            </p>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-foreground" itemProp="legalName">
                ООО «МАТ-Лабс»
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">
                ИНН: <span itemProp="taxID">6312223437</span>
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">
                ОГРН: <span itemProp="identifier">126630004288</span>
              </p>
              <p className="text-muted-foreground text-[11px] mt-2 leading-relaxed">
                RoomScan AI — интеллектуальный продукт ООО «МАТ-Лабс».
                Все права защищены.
              </p>
            </div>
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="pt-4 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <p className="font-mono">
            © {year} ООО «МАТ-Лабс». RoomScan AI™. Все права защищены.
          </p>
          <div className="flex items-center gap-4 font-mono">
            <span className="flex items-center gap-1">
              <Icon name="ShieldCheck" size={11} className="text-primary" />
              Контент защищён авторским правом
            </span>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground/60 leading-relaxed">
          Любое копирование, распространение, переработка или иное использование материалов сайта
          (включая дизайн, тексты, программный код, базы данных, изображения и алгоритмы)
          без письменного разрешения правообладателя — ООО «МАТ-Лабс» (ИНН 6312223437) — запрещено
          и преследуется в соответствии со ст. 1259, 1270, 1300 ГК РФ.
        </p>
      </div>
    </footer>
  );
}