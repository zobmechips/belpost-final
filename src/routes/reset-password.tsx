import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: "Сброс пароля — БЕЛПОЧТА" }],
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const { pushToast } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      pushToast("Недействительная ссылка для сброса пароля", "error");
      return;
    }
    if (password.length < 6) {
      pushToast("Пароль должен быть не менее 6 символов", "error");
      return;
    }
    if (password !== confirm) {
      pushToast("Пароли не совпадают", "error");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      pushToast("Пароль успешно изменён", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Ошибка сброса пароля", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="section-title mb-6">Сброс пароля</h1>
        {done ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Пароль обновлён. Теперь вы можете войти с новым паролем.</p>
            <Link to="/" className="btn-primary inline-flex">
              На главную
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="grid gap-4">
            {!token && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Ссылка недействительна. Запросите сброс пароля повторно.
              </p>
            )}
            <label className="fluid-label">
              Новый пароль
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fluid-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label className="fluid-label">
              Подтвердите пароль
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="fluid-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" disabled={loading || !token} className="btn-primary">
              {loading ? "…" : "Сохранить пароль"}
            </button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}
