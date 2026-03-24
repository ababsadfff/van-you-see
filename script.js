const themeToggle = document.getElementById("themeToggle");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const storedTheme = localStorage.getItem("theme");
if (storedTheme === "light") {
  document.documentElement.setAttribute("data-theme", "light");
  if (themeToggle) themeToggle.textContent = "☀️";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "dark");
    }
  });
}

const canvas = document.getElementById("physicsCanvas");
const statsEl = document.getElementById("stats");
const gravityInput = document.getElementById("gravityInput");
const bounceInput = document.getElementById("bounceInput");
const countInput = document.getElementById("countInput");
const gravityValue = document.getElementById("gravityValue");
const bounceValue = document.getElementById("bounceValue");
const countValue = document.getElementById("countValue");
const resetBtn = document.getElementById("resetBodies");

if (canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const world = {
      gravity: 0.35,
      bounce: 0.82,
      bodies: [],
      width: 860,
      height: 420,
      frame: 0,
      collisions: 0,
      mouse: { x: 0, y: 0, down: false, selected: null, offsetX: 0, offsetY: 0 }
    };

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function bodyColor(i) {
      const palette = ["#8f7cff", "#58d6ff", "#ff74c8", "#ffe26f", "#72ffa0"];
      return palette[i % palette.length];
    }

    function createBodies(count) {
      world.bodies = [];
      for (let i = 0; i < count; i += 1) {
        const r = rand(9, 18);
        world.bodies.push({
          id: i + 1,
          x: rand(r + 5, world.width - r - 5),
          y: rand(r + 5, world.height * 0.5),
          vx: rand(-2.6, 2.6),
          vy: rand(-0.5, 2.2),
          r,
          color: bodyColor(i),
          mass: r * 0.12
        });
      }
    }

    function updateControls() {
      if (gravityValue) gravityValue.textContent = world.gravity.toFixed(2);
      if (bounceValue) bounceValue.textContent = world.bounce.toFixed(2);
      if (countValue) countValue.textContent = String(world.bodies.length);
    }

    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = Math.max(300, Math.floor(parent.clientWidth - 20));
      const cssHeight = 420;
      world.width = cssWidth;
      world.height = cssHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createBodies(Number(countInput && countInput.value ? countInput.value : 18));
      updateControls();
    }

    function circleHit(mx, my, b) {
      const dx = mx - b.x;
      const dy = my - b.y;
      return dx * dx + dy * dy <= b.r * b.r;
    }

    function resolveCollision(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const minDist = a.r + b.r;
      if (dist >= minDist) return;

      world.collisions += 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const speedAlongNormal = rvx * nx + rvy * ny;
      if (speedAlongNormal > 0) return;

      const e = world.bounce;
      const invMassA = 1 / a.mass;
      const invMassB = 1 / b.mass;
      const j = (-(1 + e) * speedAlongNormal) / (invMassA + invMassB);
      const ix = j * nx;
      const iy = j * ny;
      a.vx -= ix * invMassA;
      a.vy -= iy * invMassA;
      b.vx += ix * invMassB;
      b.vy += iy * invMassB;
    }

    function animate() {
      world.frame += 1;
      world.collisions = 0;
      ctx.clearRect(0, 0, world.width, world.height);

      for (let i = 0; i < world.bodies.length; i += 1) {
        const b = world.bodies[i];

        if (world.mouse.selected === b && world.mouse.down) {
          b.x = world.mouse.x - world.mouse.offsetX;
          b.y = world.mouse.y - world.mouse.offsetY;
          b.vx *= 0.8;
          b.vy *= 0.8;
        } else {
          b.vy += world.gravity;
          b.x += b.vx;
          b.y += b.vy;
        }

        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx *= -world.bounce;
        } else if (b.x + b.r > world.width) {
          b.x = world.width - b.r;
          b.vx *= -world.bounce;
        }
        if (b.y - b.r < 0) {
          b.y = b.r;
          b.vy *= -world.bounce;
        } else if (b.y + b.r > world.height) {
          b.y = world.height - b.r;
          b.vy *= -world.bounce;
          if (Math.abs(b.vy) < 0.35) b.vy = 0;
        }
      }

      for (let i = 0; i < world.bodies.length; i += 1) {
        for (let j = i + 1; j < world.bodies.length; j += 1) {
          resolveCollision(world.bodies[i], world.bodies[j]);
        }
      }

      for (let i = 0; i < world.bodies.length; i += 1) {
        const b = world.bodies[i];
        const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, b.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (statsEl) {
        const fpsHint = Math.min(60, (1000 / 16.67).toFixed(0));
        statsEl.textContent =
          `frame: ${world.frame}\n` +
          `bodies: ${world.bodies.length}\n` +
          `collisions: ${world.collisions}\n` +
          `gravity: ${world.gravity.toFixed(2)}\n` +
          `bounce: ${world.bounce.toFixed(2)}\n` +
          `fps target: ${fpsHint}`;
      }

      window.requestAnimationFrame(animate);
    }

    function getPointerPosition(ev) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
      };
    }

    canvas.addEventListener("pointerdown", (ev) => {
      const p = getPointerPosition(ev);
      world.mouse.x = p.x;
      world.mouse.y = p.y;
      world.mouse.down = true;
      for (let i = world.bodies.length - 1; i >= 0; i -= 1) {
        const b = world.bodies[i];
        if (circleHit(p.x, p.y, b)) {
          world.mouse.selected = b;
          world.mouse.offsetX = p.x - b.x;
          world.mouse.offsetY = p.y - b.y;
          b.vx = 0;
          b.vy = 0;
          break;
        }
      }
    });

    canvas.addEventListener("pointermove", (ev) => {
      const p = getPointerPosition(ev);
      if (world.mouse.down && world.mouse.selected) {
        const selected = world.mouse.selected;
        selected.vx = (p.x - world.mouse.x) * 0.22;
        selected.vy = (p.y - world.mouse.y) * 0.22;
      }
      world.mouse.x = p.x;
      world.mouse.y = p.y;
    });

    function releasePointer() {
      world.mouse.down = false;
      world.mouse.selected = null;
    }

    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointerleave", releasePointer);

    if (gravityInput instanceof HTMLInputElement) {
      gravityInput.addEventListener("input", () => {
        world.gravity = Number(gravityInput.value);
        updateControls();
      });
    }

    if (bounceInput instanceof HTMLInputElement) {
      bounceInput.addEventListener("input", () => {
        world.bounce = Number(bounceInput.value);
        updateControls();
      });
    }

    if (countInput instanceof HTMLInputElement) {
      countInput.addEventListener("input", () => {
        const count = Number(countInput.value);
        createBodies(count);
        updateControls();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        createBodies(Number(countInput && countInput.value ? countInput.value : 18));
      });
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();
  }
}
