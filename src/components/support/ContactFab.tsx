import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageCircle, MessageSquare, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

const CONSULTANT_AVATAR = "/consultant.png";
const GREETING = "Здравствуйте! Я Анастасия, консультант Белпочты. Помогу с тарифами, отслеживанием посылок, подпиской и филателией.";
const AUTO_GREETING_KEY = "belpost-chat-auto-v2";

function TelegramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.059 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.154.234.17.328.015.094.034.308.019.475z" />
    </svg>
  );
}

function ViberLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.12-9.91 9.2 0 1.62.45 3.18 1.3 4.53L2 22l6.33-1.65a10.2 10.2 0 0 0 3.71.68c5.46 0 9.91-4.12 9.91-9.19C21.95 6.12 17.5 2 12.04 2zm5.8 13.06c-.25.7-1.45 1.34-2.01 1.43-.51.08-1.17.12-1.89-.12-.44-.15-1.01-.35-1.74-.68-3.06-1.33-5.05-4.43-5.2-4.64-.15-.21-1.24-1.65-1.24-3.15s.79-2.23 1.07-2.54c.27-.31.59-.39.79-.39.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2.01.89 2.16.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.31.4-.44.54-.15.15-.3.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.2.77-.9.98-1.21.21-.31.42-.26.71-.16.29.1 1.82.86 2.13 1.02.31.15.52.23.6.36.08.13.08.75-.17 1.45z" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="ai-chat-typing">
      <span>Анастасия печатает</span>
      <div className="ai-chat-dots">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

type ChatMessage = { from: "user" | "bot"; text: string };

type AiChatPanelProps = {
  open: boolean;
  onClose: () => void;
  runAutoGreeting: boolean;
  onAutoGreetingDone: () => void;
};

function AiChatPanel({ open, onClose, runAutoGreeting, onAutoGreetingDone }: AiChatPanelProps) {
  const { reduceMotion } = useApp();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, typing, reduceMotion]);

  useEffect(() => {
    if (!open || !runAutoGreeting) return;
    setMessages([]);
    setTyping(true);
    const typingTimer = window.setTimeout(() => {
      setTyping(false);
      setMessages([{ from: "bot", text: GREETING }]);
      onAutoGreetingDone();
    }, 3000);
    return () => window.clearTimeout(typingTimer);
  }, [open, runAutoGreeting, onAutoGreetingDone]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const data = await api.chat(text);
      setMessages((m) => [...m, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Извините, не удалось получить ответ. Попробуйте ещё раз или позвоните в контакт-центр: 154." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ai-chat-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <header className="ai-chat-header">
            <img src={CONSULTANT_AVATAR} alt="" className="ai-chat-avatar" />
            <div className="min-w-0 flex-1">
              <p className="ai-chat-name">Анастасия</p>
              <p className="ai-chat-status">
                <span className="ai-chat-online" /> В сети
              </p>
            </div>
            <button type="button" className="ai-chat-close" onClick={onClose} aria-label="Закрыть чат">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="ai-chat-messages">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                className={`ai-chat-bubble ${m.from === "user" ? "is-user" : "is-bot"}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="ai-chat-text">{m.text}</p>
              </motion.div>
            ))}
            {typing && <TypingIndicator />}
          </div>

          <div className="ai-chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
              placeholder="Напишите сообщение…"
              className="ai-chat-input"
              disabled={typing}
            />
            <button type="button" className="ai-chat-send" onClick={() => void send()} disabled={typing || !input.trim()} aria-label="Отправить">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContactFab() {
  const { reduceMotion } = useApp();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [runAutoGreeting, setRunAutoGreeting] = useState(false);
  const userDismissed = useRef(sessionStorage.getItem(AUTO_GREETING_KEY) === "1");

  useEffect(() => {
    if (userDismissed.current) return;
    const openAuto = () => {
      setOpen(false);
      setChatOpen(true);
      setRunAutoGreeting(true);
    };
    const timer = window.setTimeout(openAuto, 5000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleCloseChat = useCallback(() => {
    userDismissed.current = true;
    sessionStorage.setItem(AUTO_GREETING_KEY, "1");
    setChatOpen(false);
    setRunAutoGreeting(false);
  }, []);

  const openChat = () => {
    setOpen(false);
    setChatOpen(true);
  };

  const toggle = () => {
    setOpen((v) => !v);
    if (chatOpen) handleCloseChat();
  };

  const actions = [
    { id: "tg", label: "Telegram", color: "#229ED9", href: "https://t.me/staryi_viwaldi", icon: <TelegramLogo /> },
    { id: "vb", label: "Viber", color: "#7360F2", href: "viber://chat?number=%2B375445900154", icon: <ViberLogo /> },
    { id: "chat", label: "Онлайн-чат", color: "#1F6FD8", onClick: openChat, icon: <MessageSquare className="h-5 w-5" strokeWidth={2} /> },
  ];

  return (
    <div className="contact-fab-root">
      <AiChatPanel
        open={chatOpen}
        onClose={handleCloseChat}
        runAutoGreeting={runAutoGreeting}
        onAutoGreetingDone={() => setRunAutoGreeting(false)}
      />

      <div className="contact-fab-stack">
        <AnimatePresence>
          {open &&
            actions.map((a, i) => (
              <motion.a
                key={a.id}
                href={a.href}
                target={a.href?.startsWith("http") ? "_blank" : undefined}
                rel={a.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (a.onClick) {
                    e.preventDefault();
                    a.onClick();
                  }
                }}
                className="contact-fab-action"
                style={{ background: a.color }}
                title={a.label}
                initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.6 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 320, damping: 22 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {a.icon}
              </motion.a>
            ))}
        </AnimatePresence>

        <motion.button
          type="button"
          className="contact-fab-main"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Закрыть меню связи" : "Связаться с нами"}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          whileHover={{ scale: 1.05 }}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </motion.button>
      </div>
    </div>
  );
}
