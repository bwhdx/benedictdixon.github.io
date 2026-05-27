// Cursor candle trail — emits tiny vertical "candle wicks" behind the cursor.
// On click, drops a "candle body" briefly.
// Designed to be subtle: small, low opacity, fades quickly.

function CursorTrail({ enabled = true }) {
  const wrapRef = React.useRef(null);
  const lastEmit = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Skip on touch-only devices
    if (window.matchMedia('(hover: none)').matches) return;

    let frameQueued = false;
    let nextPos = { x: 0, y: 0 };
    let lastX = -100, lastY = -100;
    let lastTime = performance.now();

    function emit(x, y, velocity) {
      const now = performance.now();
      if (now - lastEmit.current < 28) return;
      lastEmit.current = now;

      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed; left: ${x - 0.5}px; top: ${y - 6}px;
        width: 1.2px; height: ${4 + Math.min(velocity * 0.6, 16)}px;
        background: #1c267a;
        opacity: 0.55;
        pointer-events: none;
        z-index: 100;
        transition: opacity 0.9s linear, transform 0.9s cubic-bezier(.2,.7,.3,1);
        mix-blend-mode: multiply;
      `;
      wrap.appendChild(el);
      // Drop down + fade
      requestAnimationFrame(() => {
        el.style.transform = `translateY(${10 + Math.random() * 6}px)`;
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 950);
    }

    function onMove(e) {
      nextPos = { x: e.clientX, y: e.clientY };
      if (!frameQueued) {
        frameQueued = true;
        requestAnimationFrame(() => {
          frameQueued = false;
          const dx = nextPos.x - lastX;
          const dy = nextPos.y - lastY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const now = performance.now();
          const dt = Math.max(1, now - lastTime);
          const v = dist / dt * 16;
          lastTime = now;
          if (dist > 4) {
            emit(nextPos.x, nextPos.y, v);
          }
          lastX = nextPos.x; lastY = nextPos.y;
        });
      }
    }

    function onClick(e) {
      // Larger "body" on click
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed; left: ${e.clientX - 5}px; top: ${e.clientY - 14}px;
        width: 10px; height: 28px;
        background: #1c267a;
        opacity: 0.85;
        pointer-events: none;
        z-index: 100;
        transition: opacity 0.7s ease-out, transform 0.7s cubic-bezier(.2,.7,.3,1);
        mix-blend-mode: multiply;
      `;
      wrap.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(-18px) scaleY(1.4)';
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 750);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
    };
  }, [enabled]);

  return <div ref={wrapRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }} />;
}

window.CursorTrail = CursorTrail;
