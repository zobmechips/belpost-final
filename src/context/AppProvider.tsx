import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, writeAccessToken, type AdminCredentials } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

const isBrowser = typeof window !== "undefined";
const ADMIN_LOGIN = "staryi_";

function readStorage(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStorage(key: string) {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export type CartItem = {
  id: string;
  title: string;
  price: number;
  qty?: number;
};

export type User = {
  email: string;
  name: string;
  phone?: string;
  trackingIds: string[];
  wallet?: number;
  address?: string;
  role?: "user" | "admin";
  clientId?: string;
  identificationCode?: string;
  consents?: {
    processing: boolean;
    marketing: boolean;
    analytics: boolean;
  };
};

export type ToastItem = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type AppContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (section: keyof import("@/lib/i18n").TranslationTree, key: string) => string;
  a11y: boolean;
  toggleA11y: () => void;
  reduceMotion: boolean;
  user: User | null;
  setUser: (user: User) => void;
  isAdmin: boolean;
  adminCreds: AdminCredentials | null;
  login: (login: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  registerAuthOpener: (fn: () => void) => void;
  requireAuth: (action?: () => void) => boolean;
  cart: CartItem[];
  cartCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  tariffs: Record<string, { title: string; price: number }>;
  tariffsLoading: boolean;
  toasts: ToastItem[];
  pushToast: (message: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function prefersReducedMotion() {
  if (!isBrowser) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function persistUser(user: User | null, password?: string) {
  if (!user) {
    removeStorage("belpost-user");
    removeStorage("belpost-admin-creds");
    return;
  }
  writeStorage("belpost-user", JSON.stringify(user));
  if (user.role === "admin" && password) {
    writeStorage("belpost-admin-creds", JSON.stringify({ login: ADMIN_LOGIN, password }));
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [a11y, setA11y] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [adminCreds, setAdminCreds] = useState<AdminCredentials | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tariffs, setTariffs] = useState<Record<string, { title: string; price: number }>>({});
  const [tariffsLoading, setTariffsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const authOpenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const storedLang = readStorage("belpost-lang") as Lang | null;
    if (storedLang === "ru" || storedLang === "by" || storedLang === "en") {
      setLangState(storedLang);
    }

    setA11y(readStorage("belpost-a11y") === "1");
    setReduceMotion(readStorage("belpost-a11y") === "1" || prefersReducedMotion());

    try {
      const raw = readStorage("belpost-user");
      if (raw) {
        const stored = JSON.parse(raw) as User;
        setUser(stored);
        if (stored.role !== "admin") {
          const refreshSession = async () => {
            try {
              const data = await api.refresh();
              if (data.accessToken) writeAccessToken(data.accessToken);
              const refreshed: User = {
                email: data.email,
                name: data.name,
                phone: data.phone ?? "",
                trackingIds: data.trackingIds ?? [],
                wallet: data.wallet ?? 0,
                address: data.address ?? "",
                role: data.role ?? "user",
              };
              setUser(refreshed);
              writeStorage("belpost-user", JSON.stringify(refreshed));
            } catch {
              try {
                const data = await api.me();
                const refreshed: User = {
                  email: data.email,
                  name: data.name,
                  phone: data.phone ?? "",
                  trackingIds: data.trackingIds ?? [],
                  wallet: data.wallet ?? 0,
                  address: data.address ?? "",
                  role: data.role ?? "user",
                };
                setUser(refreshed);
                writeStorage("belpost-user", JSON.stringify(refreshed));
              } catch {
                removeStorage("belpost-user");
                writeAccessToken(null);
                setUser(null);
              }
            }
          };
          void refreshSession();
        }
      }
      const creds = readStorage("belpost-admin-creds");
      if (creds) setAdminCreds(JSON.parse(creds) as AdminCredentials);
      const cartRaw = readStorage("belpost-cart");
      if (cartRaw) setCart(JSON.parse(cartRaw) as CartItem[]);
    } catch {
      setUser(null);
      setAdminCreds(null);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    writeStorage("belpost-lang", l);
  };

  const toggleA11y = () => {
    setA11y((prev) => {
      const next = !prev;
      writeStorage("belpost-a11y", next ? "1" : "0");
      const motion = next || prefersReducedMotion();
      setReduceMotion(motion);
      if (isBrowser) {
        document.documentElement.classList.toggle("a11y-mode", next);
        document.documentElement.classList.toggle("reduce-motion", motion);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isBrowser) return;
    const motion = a11y || prefersReducedMotion();
    setReduceMotion(motion);
    document.documentElement.classList.toggle("a11y-mode", a11y);
    document.documentElement.classList.toggle("reduce-motion", motion);
    document.documentElement.classList.remove("dark");
  }, [a11y]);

  const tr = useCallback((section: keyof import("@/lib/i18n").TranslationTree, key: string) => t(lang, section, key), [lang]);

  const pushToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (isBrowser) {
      window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
    }
  }, []);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  const registerAuthOpener = useCallback((fn: () => void) => {
    authOpenerRef.current = fn;
  }, []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (user) {
        action?.();
        return true;
      }
      pushToast("Войдите или зарегистрируйтесь, чтобы продолжить", "info");
      authOpenerRef.current?.();
      return false;
    },
    [user, pushToast],
  );

  const loadTariffs = useCallback(async () => {
    try {
      const data = await api.tariffs();
      if (Array.isArray(data)) {
        setTariffs(
          data.reduce<Record<string, { title: string; price: number }>>((acc, item) => {
            acc[item.id] = { title: item.title, price: Number(item.price) || 0 };
            return acc;
          }, {}),
        );
      }
    } catch {
      pushToast("Tariffs load error", "error");
    } finally {
      setTariffsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadTariffs();
    if (!isBrowser) return;
    const interval = window.setInterval(() => void loadTariffs(), 30000);
    return () => window.clearInterval(interval);
  }, [loadTariffs]);

  useEffect(() => {
    if (!isBrowser) return;
    writeStorage("belpost-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    if (!user) {
      pushToast("Для добавления в корзину войдите или зарегистрируйтесь", "info");
      authOpenerRef.current?.();
      return;
    }
    setCart((prev) => {
      if (prev.some((x) => x.id === item.id)) {
        pushToast(`«${item.title}» ${tr("cart", "alreadyInCart")}`, "info");
        return prev;
      }
      pushToast(`«${item.title}» ${tr("cart", "added")}`, "success");
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
    pushToast(tr("cart", "removed"), "info");
  };

  const clearCart = () => setCart([]);

  const applyUser = (u: User, password?: string) => {
    setUser(u);
    if (u.role === "admin" && password) {
      const creds = { login: ADMIN_LOGIN, password };
      setAdminCreds(creds);
      writeStorage("belpost-admin-creds", JSON.stringify(creds));
    }
    writeStorage("belpost-user", JSON.stringify(u));
    return u;
  };

  const login = async (loginId: string, password: string) => {
    const data = await api.login(loginId, password);
    if (data.accessToken) writeAccessToken(data.accessToken);
    const u: User = {
      email: data.email,
      name: data.name,
      phone: data.phone ?? "",
      trackingIds: data.trackingIds ?? [],
      wallet: data.wallet ?? 0,
      address: data.address ?? "",
      role: data.role ?? "user",
      clientId: data.clientId,
      identificationCode: data.identificationCode,
      consents: data.consents,
    };
    return applyUser(u, u.role === "admin" ? password : undefined);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.register(name, email, password);
    if (data.accessToken) writeAccessToken(data.accessToken);
    const u: User = {
      email: data.email,
      name: data.name,
      phone: data.phone ?? "",
      trackingIds: data.trackingIds ?? [],
      wallet: data.wallet ?? 0,
      address: data.address ?? "",
      role: "user",
      clientId: data.clientId,
      identificationCode: data.identificationCode,
      consents: data.consents,
    };
    return applyUser(u);
  };

  const logout = () => {
    void api.logout().catch(() => {});
    writeAccessToken(null);
    setUser(null);
    setAdminCreds(null);
    persistUser(null);
  };

  const updateUser = (u: User) => {
    setUser(u);
    writeStorage("belpost-user", JSON.stringify(u));
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      tr,
      a11y,
      toggleA11y,
      reduceMotion,
      user,
      setUser: updateUser,
      isAdmin: user?.role === "admin",
      adminCreds,
      login,
      register,
      logout,
      registerAuthOpener,
      requireAuth,
      cart,
      cartCount: cart.length,
      addToCart,
      removeFromCart,
      clearCart,
      tariffs,
      tariffsLoading,
      toasts,
      pushToast,
      dismissToast,
    }),
    [lang, tr, a11y, reduceMotion, user, adminCreds, cart, tariffs, tariffsLoading, toasts, pushToast, registerAuthOpener, requireAuth],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
