import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type LessonStep } from "@/lib/learning-courses";

/**
 * Общие мелкие куски учебного модуля: заглушка «урок не найден»
 * и человекочитаемые подписи для типов шагов урока.
 */

export function LessonNotFound({ onBack }: { onBack: () => void }) {
  return (
    <Card className="p-10 text-center">
      <Icon name="SearchX" size={40} className="mx-auto text-muted-foreground mb-3" />
      <p className="font-semibold text-foreground">Урок не найден</p>
      <Button onClick={onBack} variant="ghost" className="mt-3">
        Вернуться к курсам
      </Button>
    </Card>
  );
}

export function stepTypeLabel(t: LessonStep["type"]): string {
  switch (t) {
    case "intro": return "Введение";
    case "feature": return "Возможность";
    case "tip": return "Совет";
    case "quiz": return "Вопрос";
    case "cta": return "Финал";
  }
}
