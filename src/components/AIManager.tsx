import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/00d79c53-37be-4a9c-8b3f-2b4d8a172e01";
const STORAGE_KEY = "roomscan:ai_chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

const QUICK_PROMPTS = [
  { icon: "ScanLine", text: "С чего начать?" },
  { icon: "Calculator", text: "Помоги с расчётом сметы" },
  { icon: "Wand2", text: "Подбери стиль интерьера" },
  { icon: "Sofa", text: "Покажи каталог мебели" },
];

const MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", desc: "Быстрая, экономная", icon: "Zap" },
  { id: "openai/gpt-4o", name: "GPT-4o", desc: "Самая умная", icon: "Sparkles" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", desc: "Творческая", icon: "Feather" },
  { id: "anthropic/claude-3-5-haiku", name: "Claude 3.5 Haiku", desc: "Лёгкая Claude", icon: "Wind" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "Молниеносная", icon: "Bolt" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek", desc: "Хороша в логике", icon: "Brain" },
  { id: "yandex/yandexgpt-lite", name: "YandexGPT Lite", desc: "Российская", icon: "Globe" },
];

const MODEL_KEY = "roomscan:ai_model";

const SECTION_LABELS: Record<string, string> = {
  home: "Главная",
  scan: "Сканирование",
  usecases: "Сценарии",
  planner: "Планировщик",
  catalog: "Каталог",
  styles: "AI-стили",
  calc: "Смета",
  export: "Экспорт",
  partners: "Партнёрам",
  help: "Помощь",
  projects: "Мои проекты",
  profile: "Профиль",
};

export default function AIManager({ activeSection, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [model, setModel] = useState<string>(() => {
    if (typeof window === "undefined") return MODELS[0].id;
    return localStorage.getItem(MODEL_KEY) || MODELS[0].id;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* quota */
    }
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(MODEL_KEY, model);
  }, [model]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context: { section: activeSection || "" },
          model,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "(пустой ответ)" },
      ]);
      if (!open) setHasUnread(true);

      // Автонавигация по команде ИИ
      if (data.action && onNavigate) {
        setTimeout(() => onNavigate(data.action), 600);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            e instanceof Error
              ? `Не удалось получить ответ: ${e.message}. Попробуйте позже.`
              : "Сетевая ошибка.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 ${
          open ? "rotate-0" : ""
        }`}
        aria-label={open ? "Закрыть чат" : "Открыть чат с ИИ"}
      >
        {open ? (
          <Icon name="X" size={22} />
        ) : (
          <>
            <Icon name="Sparkles" size={22} />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Панель чата */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col animate-fade-in overflow-hidden">
          {/* Шапка */}
          <div className="bg-gradient-to-br from-[#0f1419] to-[#0a0f0c] text-white p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center shrink-0">
              <Icon name="Bot" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-white text-sm">Менеджер проекта</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  AI
                </span>
              </div>
              <p className="text-xs text-white/60 truncate">
                {activeSection && SECTION_LABELS[activeSection]
                  ? `Вы на странице: ${SECTION_LABELS[activeSection]}`
                  : "Помогу разобраться с проектом"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowModelPicker((s) => !s)}
                title="Выбрать модель"
                className={`text-white/50 hover:text-white transition-colors ${showModelPicker ? "text-primary" : ""}`}
              >
                <Icon name="Settings2" size={16} />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  title="Очистить чат"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Селектор модели */}
          {showModelPicker && (
            <div className="border-b border-border bg-secondary/40 p-3 max-h-[260px] overflow-y-auto animate-fade-in">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 px-1">
                Модель ИИ · Polza.ai
              </p>
              <div className="space-y-1">
                {MODELS.map((m) => {
                  const active = m.id === model;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-background border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                        }`}
                      >
                        <Icon name={m.icon} size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? "text-primary" : "text-foreground"}`}>
                          {m.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.desc}</p>
                      </div>
                      {active && <Icon name="Check" size={14} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Сообщения */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[420px]">
            {messages.length === 0 && !loading && (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    Привет! Я ваш персональный менеджер проекта. Расскажу, как пользоваться сервисом, помогу с расчётами и подберу решения под вашу задачу.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Быстрый старт
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.text}
                        onClick={() => send(p.text)}
                        className="flex items-center gap-2 text-left bg-secondary hover:bg-primary/10 hover:text-primary transition-colors rounded-lg px-3 py-2 text-sm text-foreground"
                      >
                        <Icon name={p.icon} size={15} className="text-primary shrink-0" />
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  <Icon name={m.role === "user" ? "User" : "Bot"} size={14} />
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-foreground rounded-tl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon name="Bot" size={14} className="text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Поле ввода */}
          <div className="border-t border-border p-3 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Спросите что-нибудь…"
                disabled={loading}
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground text-sm rounded-xl px-4 py-2.5 border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name={loading ? "Loader2" : "Send"} size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
              <button
                onClick={() => setShowModelPicker((s) => !s)}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Icon
                  name={MODELS.find((m) => m.id === model)?.icon || "Sparkles"}
                  size={10}
                  className="text-primary"
                />
                <span>{MODELS.find((m) => m.id === model)?.name || "AI"}</span>
              </button>
              <span className="text-border">·</span>
              <span>via Polza.ai</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}