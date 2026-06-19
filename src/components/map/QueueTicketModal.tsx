import { useState } from "react";
import { FluidModal } from "@/components/belpost/FluidModal";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";
import type { Office } from "@/components/map/YandexOfficesMap";

type QueueTicketModalProps = {
  office: Office | null;
  onClose: () => void;
};

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function QueueTicketModal({ office, onClose }: QueueTicketModalProps) {
  const { user, pushToast, requireAuth } = useApp();
  const [date, setDate] = useState("");
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [loading, setLoading] = useState(false);

  if (!office) return null;

  const submit = async () => {
    if (!user) {
      requireAuth();
      return;
    }
    if (!date) {
      pushToast("Выберите дату визита", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.bookQueueTicket({
        officeId: office.id,
        date,
        time,
        name: user.name,
      });
      pushToast(`Талон забронирован: ${office.city}, ${date} в ${time}. №${res.ticket?.id?.slice(0, 8)}`, "success");
      onClose();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка бронирования", "error");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <FluidModal
      open={Boolean(office)}
      title="Электронная очередь"
      onClose={onClose}
      footer={
        <button type="button" className="btn-primary" disabled={loading} onClick={() => void submit()}>
          {loading ? "…" : "Забронировать талон"}
        </button>
      }
    >
      <div className="grid gap-4 text-sm">
        <p className="text-slate-600">
          <strong>{office.city}</strong>, {office.address}
          <br />
          Отделение №{office.number}
        </p>
        <label className="fluid-label">
          Дата визита
          <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className="fluid-input" />
        </label>
        <label className="fluid-label">
          Время
          <select value={time} onChange={(e) => setTime(e.target.value)} className="fluid-input">
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        {!user && <p className="text-xs text-slate-500">Для бронирования необходимо войти в личный кабинет.</p>}
      </div>
    </FluidModal>
  );
}
