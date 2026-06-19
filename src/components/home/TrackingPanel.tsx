import { useState } from "react";
import { TrackingStepper } from "@/components/belpost/TrackingStepper";
import { TrackingQr } from "@/components/tracking/TrackingQr";
import { useApp } from "@/context/AppProvider";
import { api, isValidTrackingId } from "@/lib/api";

export type TrackEvent = {
  step: number;
  time: string;
  city: string;
  office: string;
  label: string;
};

export function TrackingPanel() {
  const { tr, pushToast } = useApp();
  const [track, setTrack] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const runTracking = async () => {
    const value = track.trim().toUpperCase();
    if (!isValidTrackingId(value)) {
      pushToast(tr("tracking", "invalid"), "error");
      return;
    }
    setLoading(true);
    try {
      const data = await api.track(value);
      setTrackId(value);
      setEvents(data.events ?? []);
      setStep(data.events?.length ? data.events[data.events.length - 1].step : 0);
      setVisible(true);
      pushToast(`${tr("tracking", "stepAccepted")}: ${value}`, "success");
    } catch (e) {
      setVisible(false);
      setTrackId(null);
      pushToast(e instanceof Error ? e.message : tr("tracking", "notFound"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracking-panel relative z-20 -mb-6 mt-4 translate-y-4">
      <div className="tracking-panel-row">
        <div className="tracking-panel-title">{tr("tracking", "title")}</div>
        <div className="tracking-input-wrap flex-1">
          <input
            value={track}
            onChange={(e) => setTrack(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && void runTracking()}
            placeholder={tr("tracking", "placeholder")}
            className="tracking-input"
            maxLength={13}
          />
        </div>
        <button type="button" onClick={() => void runTracking()} disabled={loading} className="btn-primary tracking-submit">
          {loading ? "…" : tr("tracking", "submit")}
        </button>
      </div>
      <TrackingStepper
        activeStep={step}
        visible={visible}
        labels={[tr("tracking", "stepAccepted"), tr("tracking", "stepSort"), tr("tracking", "stepTransit"), tr("tracking", "stepDelivered")]}
      />
      {visible && trackId && <TrackingQr trackingId={trackId} />}
      {visible && events.length > 0 && (
        <ul className="tracking-events-list">
          {events.map((ev, i) => (
            <li key={i} className="tracking-event-item">
              <span className="font-semibold text-brand">{ev.label}</span>
              <span>{new Date(ev.time).toLocaleString()}</span>
              <span>{ev.city}</span>
              <span className="text-slate-400">{ev.office}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
