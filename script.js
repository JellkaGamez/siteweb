const title = document.querySelector('h1');
let cx = window.innerWidth / 2;
let cy = window.innerHeight / 2;
let tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  cx = e.clientX;
  cy = e.clientY;
});

function tick() {
  const rect = title.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  const dx = (cx - ox) / window.innerWidth;
  const dy = (cy - oy) / window.innerHeight;
  tx += (dx * 18 - tx) * 0.08;
  ty += (dy * 12 - ty) * 0.08;
  title.style.transform = `translate(${tx}px, ${ty}px)`;
  requestAnimationFrame(tick);
}

tick();
