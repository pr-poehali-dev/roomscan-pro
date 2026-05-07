import { forwardRef } from "react";
import { TIER_META, formatRub, type EstimateResult, type RoomInput } from "@/lib/estimate";

interface Props {
  room: RoomInput;
  result: EstimateResult;
  projectName?: string;
}

/**
 * Печатный/PDF-шаблон сметы.
 * Стилизован под типографский бланк: чёрный текст на белом фоне,
 * никаких теней и градиентов. Готов к экспорту через jsPDF.html().
 */
const EstimatePrintTemplate = forwardRef<HTMLDivElement, Props>(({ room, result, projectName }, ref) => {
  const tier = TIER_META[result.tier];
  const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      ref={ref}
      style={{
        width: "780px",
        background: "#fff",
        color: "#111",
        fontFamily: "'Golos Text', Arial, sans-serif",
        padding: "32px",
        fontSize: "12px",
        lineHeight: 1.4,
      }}
    >
      {/* Шапка */}
      <div style={{ borderBottom: "2px solid #16a34a", paddingBottom: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "10px", letterSpacing: "2px", color: "#666", textTransform: "uppercase", margin: 0 }}>
              RoomScan AI · АВАНГАРД
            </p>
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "4px 0", color: "#111" }}>
              Смета на ремонт
            </h1>
            {projectName && (
              <p style={{ fontSize: "14px", color: "#444", margin: 0 }}>
                {projectName}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#666" }}>
            <p style={{ margin: 0 }}>{today}</p>
            <p style={{ margin: "2px 0 0", fontWeight: "bold", color: "#16a34a" }}>
              Тариф: {tier.label}
            </p>
          </div>
        </div>
      </div>

      {/* Параметры помещения */}
      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#111" }}>
        Параметры помещения
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "12px" }}>
        <tbody>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 8px", color: "#666" }}>Площадь</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{room.area.toFixed(1)} м²</td>
            <td style={{ padding: "6px 8px", color: "#666" }}>Периметр стен</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{room.perimeter.toFixed(1)} м</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 8px", color: "#666" }}>Высота потолка</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{room.height.toFixed(2)} м</td>
            <td style={{ padding: "6px 8px", color: "#666" }}>Объём</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{(room.area * room.height).toFixed(1)} м³</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 8px", color: "#666" }}>Дверей</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{room.doors} шт</td>
            <td style={{ padding: "6px 8px", color: "#666" }}>Окон</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>{room.windows} шт</td>
          </tr>
        </tbody>
      </table>

      {/* Группы работ */}
      <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#111" }}>
        Детализация сметы
      </h2>

      {result.groups.map((g) => (
        <div key={g.key} style={{ marginBottom: "14px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f4f4f4", padding: "6px 10px", borderLeft: "3px solid #16a34a",
            marginBottom: "4px",
          }}>
            <span style={{ fontWeight: "bold", fontSize: "13px" }}>{g.name}</span>
            <span style={{ fontWeight: "bold", color: "#16a34a", fontSize: "13px" }}>{formatRub(g.total)}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "normal" }}>Наименование</th>
                <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal", width: "70px" }}>Кол-во</th>
                <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal", width: "80px" }}>Цена</th>
                <th style={{ textAlign: "right", padding: "4px 8px", fontWeight: "normal", width: "100px" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {g.lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "4px 8px" }}>{l.name}</td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {l.qty.toFixed(l.unit === "шт" || l.unit === "комплект" ? 0 : 1)} {l.unit}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 8px" }}>
                    {l.price.toLocaleString("ru-RU")} ₽
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: "bold" }}>
                    {formatRub(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Итог */}
      <div style={{ background: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "6px", padding: "14px 16px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", color: "#666" }}>Работы</span>
          <span style={{ fontWeight: "bold" }}>{formatRub(result.worksTotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", color: "#666" }}>Материалы</span>
          <span style={{ fontWeight: "bold" }}>{formatRub(result.materialsTotal)}</span>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid #16a34a", paddingTop: "10px",
        }}>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#111" }}>ИТОГО</span>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#16a34a" }}>
            {formatRub(result.grandTotal)}
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "11px", color: "#666" }}>
          <span>≈ {formatRub(result.perSqm)} за м²</span>
          <span>~{result.daysApprox} рабочих дней</span>
          <span>Гарантия: {result.warranty}</span>
        </div>
      </div>

      {/* Подвал */}
      <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #ddd", fontSize: "10px", color: "#999", textAlign: "center" }}>
        Расчёт выполнен сервисом RoomScan AI · roomscan-ai.ru<br/>
        Цены ориентировочные, рынок Москвы и МО. Для точной сметы свяжитесь с подрядчиком.
      </div>
    </div>
  );
});

EstimatePrintTemplate.displayName = "EstimatePrintTemplate";

export default EstimatePrintTemplate;
