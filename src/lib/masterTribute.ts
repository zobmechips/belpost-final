import { fireGrandConfetti } from "@/lib/confetti";

const TRIBUTE_MS = 60_000;
const AUDIO_SRC = "/Carmen Se Me Perdio La Cadenita.mp3";
const CAT_SRC = "/dancing-cat-33.gif";

let activeCleanup: (() => void) | null = null;

export function stopMasterTribute() {
  activeCleanup?.();
}

export function playMasterTribute() {
  activeCleanup?.();

  const overlay = document.createElement("div");
  overlay.className = "master-tribute-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const stage = document.createElement("div");
  stage.className = "master-tribute-stage";

  const cat = document.createElement("img");
  cat.src = CAT_SRC;
  cat.alt = "";
  cat.className = "master-tribute-cat";
  cat.decoding = "async";

  stage.appendChild(cat);
  overlay.appendChild(stage);
  document.body.appendChild(overlay);

  const audio = new Audio(encodeURI(AUDIO_SRC));
  audio.volume = 0.85;
  void audio.play().catch(() => {});

  const stopConfetti = fireGrandConfetti(TRIBUTE_MS);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      stopMasterTribute();
    }
  };
  window.addEventListener("keydown", onKeyDown);

  const cleanup = () => {
    window.removeEventListener("keydown", onKeyDown);
    audio.pause();
    audio.currentTime = 0;
    stopConfetti();
    overlay.remove();
    if (activeCleanup === cleanup) activeCleanup = null;
  };

  const timer = window.setTimeout(cleanup, TRIBUTE_MS);
  activeCleanup = () => {
    window.clearTimeout(timer);
    cleanup();
  };
}
