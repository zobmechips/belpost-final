import { useState } from "react";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

export function NpesPanel() {
  const { user, pushToast } = useApp();
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [recipientInSystem, setRecipientInSystem] = useState(true);
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const send = async () => {
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      pushToast("Заполните адресата, тему и текст", "error");
      return;
    }
    setSending(true);
    try {
      const res = await api.sendNpes({
        userEmail: user.email,
        recipient,
        subject,
        body,
        attachmentName: attachmentName || undefined,
        recipientInSystem,
      });
      pushToast(res.message ?? "Письмо отправлено", "success");
      setRecipient("");
      setSubject("");
      setBody("");
      setAttachmentName("");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка отправки", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="npes-panel space-y-4">
      <p className="text-sm text-slate-600">
        Национальная почтовая электронная система (НПЭС) — защищённая отправка цифрового письма. Если адресат не зарегистрирован, отправление будет помечено как «Гибридное» для печати в отделении.
      </p>
      <label className="fluid-label">
        Адресат
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="fluid-input" placeholder="email@example.by" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recipientInSystem} onChange={(e) => setRecipientInSystem(e.target.checked)} />
        Адресат зарегистрирован в системе НПЭС
      </label>
      {!recipientInSystem && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Режим «Гибридное»: письмо будет напечатано в отделении для вручения на бумаге.</p>
      )}
      <label className="fluid-label">
        Тема
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="fluid-input" />
      </label>
      <label className="fluid-label">
        Текст письма
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="fluid-input min-h-[120px]" />
      </label>
      <label className="fluid-label">
        Вложение (название файла)
        <input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} className="fluid-input" placeholder="document.pdf" />
      </label>
      <button type="button" className="btn-primary w-full justify-center" disabled={sending} onClick={() => void send()}>
        {sending ? "Отправка…" : "Отправить НПЭС-письмо"}
      </button>
    </div>
  );
}
