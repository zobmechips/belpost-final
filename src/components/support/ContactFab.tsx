import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageCircle, MessageSquare, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSplashComplete } from "@/components/belpost/Preloader";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

const CONSULTANT_AVATAR = "/consultant.png";
const GREETING = "Здравствуйте! Я Анастасия, консультант Белпочты. Помогу с тарифами, отслеживанием посылок, подпиской и филателией.";
const CHAT_AUTO_OPEN_DELAY_MS = 7000;
const GREETING_TYPING_MS = 3000;

/** Сбрасывается только при полной перезагрузи страницы (F5), не при SPA-навигации */
const pageChatSession = { autoOpenScheduled: false };

type ChatMessage = { from: "user" | "bot"; text: string };

const chatEase = [0.4, 0, 0.2, 1] as const;
const dropletEase = [0.34, 1.45, 0.64, 1] as const;

function TypingBubble() {
  return (
    <motion.div
      className="ai-chat-typing-bubble"
      initial={{ opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.97 }}
      transition={{ duration: 0.38, ease: chatEase }}
    >
      <span className="ai-chat-typing-inner">
        <span className="ai-chat-typing-label">печатает</span>
        <span className="ai-chat-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="ai-chat-dot"
              animate={{ y: [0, -3.5, 0], opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
                delay: i * 0.18,
                ease: [0.45, 0, 0.55, 1],
              }}
            />
          ))}
        </span>
      </span>
    </motion.div>
  );
}

type AiChatPanelProps = {
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  typing: boolean;
  setTyping: React.Dispatch<React.SetStateAction<boolean>>;
};

function AiChatPanel({ onClose, messages, setMessages, typing, setTyping }: AiChatPanelProps) {
  const { reduceMotion } = useApp();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, typing, reduceMotion]);

  const deliverBotReply = async (fetchReply: () => Promise<string>) => {
    setTyping(true);
    const minDelay = new Promise((r) => window.setTimeout(r, 3000));
    try {
      const [reply] = await Promise.all([fetchReply(), minDelay]);
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: reply }]);
    } catch (err) {
      await minDelay;
      setTyping(false);
      const msg = err instanceof Error ? err.message : "Не удалось получить ответ";
      setMessages((m) => [
        ...m,
        { from: "bot", text: `${msg}. Попробуйте ещё раз или позвоните в контакт-центр: 154.` },
      ]);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    void deliverBotReply(async () => {
      const data = await api.chat(text);
      return data.reply as string;
    });
  };

  return (
    <motion.div
      className="ai-chat-panel"
      style={{ transformOrigin: "bottom right" }}
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.45, ease: chatEase }}
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
          <div key={`${i}-${m.text.slice(0, 12)}`} className={`ai-chat-bubble ${m.from === "user" ? "is-user" : "is-bot"}`}>
            <p className="ai-chat-text">{m.text}</p>
          </div>
        ))}
        <AnimatePresence mode="wait">
          {typing && <TypingBubble key="typing" />}
        </AnimatePresence>
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
  );
}

function TelegramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="contact-fab-icon-svg" aria-hidden fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.059 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.154.234.17.328.015.094.034.308.019.475z" />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="contact-fab-icon-svg" aria-hidden fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function ContactFab() {
  const { reduceMotion, user } = useApp();
  const splashComplete = useSplashComplete();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const greetedRef = useRef(false);
  const autoTimerRef = useRef<number | null>(null);
  const historyLoadedFor = useRef<string | null>(null);
  const prevUserEmail = useRef<string | null | undefined>(undefined);
  const isAuthUser = Boolean(user && user.role !== "admin");

  useEffect(() => {
    if (!isAuthUser || !user?.email) return;
    if (historyLoadedFor.current === user.email) return;
    historyLoadedFor.current = user.email;
    void api.chatHistory().then((data) => {
      const history = (data.messages ?? []) as ChatMessage[];
      if (history.length > 0) {
        setMessages(history);
        greetedRef.current = true;
      }
    }).catch(() => {});
  }, [isAuthUser, user?.email]);

  useEffect(() => {
    const email = user?.email ?? null;
    if (prevUserEmail.current === undefined) {
      prevUserEmail.current = email;
      return;
    }
    if (prevUserEmail.current && !email) {
      historyLoadedFor.current = null;
      setMessages([]);
      setChatOpen(false);
      setTyping(false);
      greetedRef.current = false;
    }
    prevUserEmail.current = email;
  }, [user?.email]);

  useEffect(() => {
    if (!isAuthUser || messages.length === 0) return;
    const timer = window.setTimeout(() => {
      void api.saveChatHistory(messages).catch(() => {});
    }, 400);
    return () => window.clearTimeout(timer);
  }, [messages, isAuthUser]);

  const runGreeting = useCallback(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    setTyping(true);
    autoTimerRef.current = window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => (prev.length ? prev : [{ from: "bot", text: GREETING }]));
    }, GREETING_TYPING_MS);
  }, []);

  useEffect(() => {
    if (!splashComplete || isAuthUser || pageChatSession.autoOpenScheduled) return;

    pageChatSession.autoOpenScheduled = true;
    const timer = window.setTimeout(() => {
      setMenuOpen(false);
      setChatOpen(true);
      runGreeting();
    }, CHAT_AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [splashComplete, isAuthUser, runGreeting]);

  useEffect(() => () => {
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
  }, []);

  const openChat = () => {
    setMenuOpen(false);
    setChatOpen(true);
    if (messages.length === 0 && !typing) runGreeting();
  };

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
    if (chatOpen) setChatOpen(false);
  };

  const actions: {
    id: string;
    label: string;
    color: string;
    href?: string;
    bottom: string;
    icon: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }[] = [
    { id: "tg", label: "Telegram", color: "#229ED9", href: "https://t.me/staryi_viwaldi", bottom: "4.5rem", icon: <TelegramLogo /> },
    {
      id: "ig",
      label: "Instagram",
      color: "transparent",
      href: "https://www.instagram.com/vadismxm/",
      bottom: "7.75rem",
      icon: <InstagramLogo />,
      className: "contact-fab-action--instagram",
    },
    {
      id: "chat",
      label: "Онлайн-чат",
      color: "#1F6FD8",
      bottom: "11rem",
      onClick: openChat,
      icon: <MessageSquare className="contact-fab-icon-svg" strokeWidth={2} />,
    },
  ];

  const actionCount = actions.length;

  return (
    <div className="contact-fab-root">
      <AnimatePresence>
        {chatOpen && (
          <AiChatPanel
            key="ai-chat-panel"
            onClose={() => setChatOpen(false)}
            messages={messages}
            setMessages={setMessages}
            typing={typing}
            setTyping={setTyping}
          />
        )}
      </AnimatePresence>

      <div className="contact-fab-stack">
        <AnimatePresence>
          {menuOpen &&
            actions.map((a, index) => (
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
                className={`contact-fab-action${a.className ? ` ${a.className}` : ""}`}
                style={a.className?.includes("instagram") ? { bottom: a.bottom } : { background: a.color, bottom: a.bottom }}
                title={a.label}
                initial={reduceMotion ? false : { opacity: 0, scale: 0, y: 18 }}
                animate={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        scale: 0,
                        y: 14,
                        transition: {
                          duration: 0.28,
                          delay: (actionCount - 1 - index) * 0.07,
                          ease: dropletEase,
                        },
                      }
                }
                transition={{
                  opacity: { duration: 0.32, delay: index * 0.09, ease: dropletEase },
                  scale: { duration: 0.42, delay: index * 0.09, ease: dropletEase },
                  y: { duration: 0.42, delay: index * 0.09, ease: dropletEase },
                }}
              >
                {a.icon}
              </motion.a>
            ))}
        </AnimatePresence>

        <button
          type="button"
          className={`contact-fab-main ${menuOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Закрыть меню связи" : "Связаться с нами"}
        >
          <span className="contact-fab-icon contact-fab-icon-chat">
            <MessageCircle className="h-6 w-6" />
          </span>
          <span className="contact-fab-icon contact-fab-icon-close">
            <X className="h-6 w-6" />
          </span>
        </button>
      </div>
    </div>
  );
}
