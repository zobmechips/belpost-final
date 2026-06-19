const COLORS = ["#1F6FD8", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444", "#fbbf24"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rot: number;
  vr: number;
  life: number;
};

function spawnBurst(particles: Particle[], x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 1.3) * 16,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 4,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 14,
      life: 1,
    });
  }
}

function runConfettiCanvas(particles: Particle[], maxFrames: number, onDone: () => void) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    onDone();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.life -= 0.009;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }
    frame++;
    if (alive && frame < maxFrames) requestAnimationFrame(animate);
    else {
      window.removeEventListener("resize", resize);
      canvas.remove();
      onDone();
    }
  };
  requestAnimationFrame(animate);
}

export function fireConfetti() {
  if (typeof document === "undefined") return;
  const particles: Particle[] = [];
  spawnBurst(particles, window.innerWidth / 2, window.innerHeight / 2, 140);
  runConfettiCanvas(particles, 200, () => {});
}

export function fireGrandConfetti(durationMs = 60_000): () => void {
  if (typeof document === "undefined") return () => {};

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;z-index:9998;pointer-events:none";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return () => {};
  }

  const particles: Particle[] = [];
  const start = performance.now();
  let stopped = false;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const burstFrom = (x: number, y: number, count: number) => spawnBurst(particles, x, y, count);

  burstFrom(canvas.width / 2, canvas.height / 2, 320);
  burstFrom(canvas.width * 0.2, canvas.height * 0.35, 120);
  burstFrom(canvas.width * 0.8, canvas.height * 0.35, 120);

  const burstTimer = window.setInterval(() => {
    if (stopped) return;
    const x = canvas.width * (0.15 + Math.random() * 0.7);
    const y = canvas.height * (0.2 + Math.random() * 0.45);
    burstFrom(x, y, 90 + Math.floor(Math.random() * 80));
  }, 550);

  const animate = (now: number) => {
    if (stopped) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.995;
      p.life -= 0.007;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }
    if (!stopped && (alive || now - start < durationMs)) requestAnimationFrame(animate);
    else {
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  };
  requestAnimationFrame(animate);

  return () => {
    stopped = true;
    window.clearInterval(burstTimer);
    window.removeEventListener("resize", resize);
    canvas.remove();
  };
}
