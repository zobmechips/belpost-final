import { useState } from "react";
import { FluidModal } from "@/components/belpost/FluidModal";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { role?: string }) => void;
};

type Mode = "login" | "register" | "forgot";

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const { login, register, tr, pushToast } = useApp();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setLoginId("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setMode("login");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email.trim()) {
        pushToast("Укажите email", "error");
        return;
      }
      setLoading(true);
      try {
        const data = await api.forgotPassword(email.trim());
        pushToast(data.message ?? "Проверьте почту", "success");
        setMode("login");
      } catch (err) {
        pushToast(err instanceof Error ? err.message : tr("auth", "error"), "error");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (mode === "register" && password !== confirm) {
      pushToast(tr("auth", "passwordMismatch"), "error");
      return;
    }
    if (password.length < 6) {
      pushToast(tr("auth", "passwordShort"), "error");
      return;
    }
    setLoading(true);
    try {
      const user =
        mode === "login"
          ? await login(loginId.trim(), password)
          : await register(name, email.trim(), password);
      pushToast(tr("auth", "welcome").replace("{name}", user.name), "success");
      onSuccess(user);
      handleClose();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : tr("auth", "error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login" ? tr("auth", "title") : mode === "register" ? tr("auth", "registerTitle") : "Восстановление пароля";

  return (
    <FluidModal
      open={open}
      title={title}
      onClose={handleClose}
      footer={
        <button type="submit" form="auth-form" disabled={loading} className="btn-primary">
          {loading
            ? "…"
            : mode === "login"
              ? tr("auth", "submit")
              : mode === "register"
                ? tr("auth", "registerSubmit")
                : "Отправить ссылку"}
        </button>
      }
    >
      {mode !== "forgot" && (
        <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === "login" ? "bg-white text-brand shadow-sm" : "text-slate-600"}`}
            onClick={() => setMode("login")}
          >
            {tr("auth", "tabLogin")}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === "register" ? "bg-white text-brand shadow-sm" : "text-slate-600"}`}
            onClick={() => setMode("register")}
          >
            {tr("auth", "tabRegister")}
          </button>
        </div>
      )}
      <form id="auth-form" onSubmit={(e) => void submit(e)} className="grid gap-4">
        {mode === "register" && (
          <label className="fluid-label">
            {tr("auth", "name")}
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fluid-input" required />
          </label>
        )}
        {mode === "login" ? (
          <label className="fluid-label">
            {tr("auth", "loginLabel")}
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="fluid-input"
              required
              autoComplete="username"
            />
          </label>
        ) : mode !== "forgot" ? (
          <label className="fluid-label">
            {tr("auth", "email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="fluid-input" required autoComplete="email" />
          </label>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Введите email — мы отправим ссылку для сброса пароля (в демо-режиме ссылка выводится в консоль сервера).
            </p>
            <label className="fluid-label">
              {tr("auth", "email")}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="fluid-input" required autoComplete="email" />
            </label>
          </>
        )}
        {mode !== "forgot" && (
          <label className="fluid-label">
            {tr("auth", "password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fluid-input"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
        )}
        {mode === "register" && (
          <label className="fluid-label">
            {tr("auth", "confirmPassword")}
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="fluid-input" required autoComplete="new-password" />
          </label>
        )}
        {mode === "login" && (
          <button type="button" className="text-left text-sm text-brand hover:underline" onClick={() => setMode("forgot")}>
            Забыли пароль?
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="text-left text-sm text-muted-foreground hover:underline" onClick={() => setMode("login")}>
            ← Вернуться ко входу
          </button>
        )}
      </form>
    </FluidModal>
  );
}
