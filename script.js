document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
document.getElementById('year').textContent = new Date().getFullYear();

// A drifting network with flowing signals, with no downloads or dependencies.
const canvas = document.getElementById('network');
const context = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let width = 0, height = 0, points = [], frame = 0, visible = true;
let seed = 36;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  seed = 36;
  points = Array.from({ length: width < 600 ? 65 : 110 }, () => {
    const x = random() * width;
    const y = random() * Math.min(height, 940);
    return { x, y, radius: 1 + random() * 2.4, phase: random() * Math.PI * 2, speed: .7 + random() * .6,
      opacity: x < width * .44 && y < 570 ? .055 : .25 + random() * .7 };
  });
  draw(0);
}
function draw(time) {
  context.clearRect(0, 0, width, height);
  const t = reducedMotion.matches ? 0 : time * .00065;
  const drift = width < 600 ? 25 : 48;
  const positions = points.map(p => ({
    ...p,
    x: p.x + Math.sin(t * p.speed + p.phase) * drift,
    y: p.y + Math.cos(t * p.speed * .8 + p.phase) * drift * .75,
    opacity: p.opacity * (.8 + .2 * Math.sin(t * 1.5 + p.phase))
  }));
  const reach = Math.min(width * .15, 185);
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    for (let j = i + 1; j < positions.length; j++) {
      const q = positions[j];
      const distance = Math.hypot(p.x - q.x, p.y - q.y);
      if (distance > reach) continue;
      const strength = (1 - distance / reach) * Math.min(p.opacity, q.opacity);
      context.strokeStyle = `rgba(255, 255, 255, ${strength * .8})`;
      context.lineWidth = .8;
      context.beginPath();context.moveTo(p.x, p.y);context.lineTo(q.x, q.y);context.stroke();
      // Small light pulses travel across a subset of connected edges.
      if (!reducedMotion.matches && (i + j) % 7 === 0) {
        const progress = (t * .45 + p.phase) % 1;
        const x = p.x + (q.x - p.x) * progress;
        const y = p.y + (q.y - p.y) * progress;
        context.fillStyle = `rgba(255, 255, 255, ${strength * Math.sin(progress * Math.PI)})`;
        context.beginPath();context.arc(x, y, 2, 0, Math.PI * 2);context.fill();
      }
    }
    const glow = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 7);
    glow.addColorStop(0, `rgba(255,255,255,${p.opacity * .65})`);
    glow.addColorStop(.25, `rgba(255,255,255,${p.opacity * .2})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = glow;
    context.beginPath();context.arc(p.x, p.y, p.radius * 7, 0, Math.PI * 2);context.fill();
    context.fillStyle = `rgba(255,255,255,${p.opacity})`;
    context.beginPath();context.arc(p.x, p.y, p.radius * .72, 0, Math.PI * 2);context.fill();
  }
}
function animate(time) {
  draw(time);
  frame = requestAnimationFrame(animate);
}
function updateAnimation() {
  cancelAnimationFrame(frame);
  if (!reducedMotion.matches && !document.hidden && visible) frame = requestAnimationFrame(animate);
  else draw(0);
}
if (context) {
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updateAnimation(); }).observe(canvas);
  reducedMotion.addEventListener('change', updateAnimation);
  document.addEventListener('visibilitychange', updateAnimation);
  resize();
}
