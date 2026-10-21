const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const PORT = 3456;
let savedCount = 0;
const TOTAL_ASSETS = 17;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_CONTENT);
  } else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, base64 } = JSON.parse(body);
        const buffer = Buffer.from(base64, 'base64');
        const filePath = path.join(ASSETS_DIR, filename);
        fs.writeFileSync(filePath, buffer);
        const sizeKb = (buffer.length / 1024).toFixed(1);
        console.log(`[SAVED] ${filename} -> ${sizeKb} KB`);
        savedCount++;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sizeKb }));

        if (savedCount >= TOTAL_ASSETS) {
          console.log('\nAll 17 assets saved successfully! Closing server...');
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);
        }
      } catch (err) {
        console.error('Error saving:', err);
        res.writeHead(500);
        res.end(err.message);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const bin = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`Launching headless browser: ${bin}`);
  const browser = spawn(bin, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    `http://localhost:${PORT}/`
  ]);

  browser.on('error', err => {
    console.error('Browser spawn error:', err);
  });
});

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head><title>Asset Generator</title></head>
<body>
<canvas id="c"></canvas>
<script>
const TOTAL = 17;

async function saveCanvasAsWebp(canvas, filename, maxKb = 92) {
  let quality = 0.82;
  while (quality >= 0.25) {
    const dataUrl = canvas.toDataURL('image/webp', quality);
    const base64 = dataUrl.split(',')[1];
    const sizeKb = (base64.length * 3 / 4) / 1024;
    if (sizeKb <= maxKb || quality <= 0.3) {
      await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, base64 })
      });
      return;
    }
    quality -= 0.08;
  }
}

function initCanvas(w, h) {
  const c = document.getElementById('c');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  return { c, ctx };
}

function drawVGradient(ctx, w, h, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawGlowOrb(ctx, x, y, r, color, maxAlpha = 0.3) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('ALPHA', maxAlpha));
  g.addColorStop(0.5, color.replace('ALPHA', maxAlpha * 0.4));
  g.addColorStop(1, color.replace('ALPHA', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrid(ctx, w, h, step = 50, alpha = 0.05) {
  ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

async function renderAll() {
  console.log('Starting rendering...');

  // 1. bg-hero-home.webp (1600x900)
  {
    const { c, ctx } = initCanvas(1600, 900);
    drawVGradient(ctx, 1600, 900, '#0c1016', '#07090d');
    drawGlowOrb(ctx, 1200, 350, 450, 'rgba(200, 241, 105, ALPHA)', 0.25);
    drawGlowOrb(ctx, 350, 600, 400, 'rgba(94, 230, 184, ALPHA)', 0.20);
    drawGrid(ctx, 1600, 900, 60, 0.06);

    // Subtle financial ascending chart curves in background
    ctx.strokeStyle = 'rgba(200, 241, 105, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 1600; x += 40) {
      const y = 520 - Math.sin(x / 200) * 100 - Math.cos(x / 140) * 50;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(94, 230, 184, 0.12)';
    ctx.beginPath();
    for (let x = 0; x <= 1600; x += 40) {
      const y = 600 - Math.sin(x / 260 + 1) * 80 - Math.cos(x / 100) * 40;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    await saveCanvasAsWebp(c, 'bg-hero-home.webp');
  }

  // 2. bg-hero-about.webp (1600x800)
  {
    const { c, ctx } = initCanvas(1600, 800);
    drawVGradient(ctx, 1600, 800, '#0d121a', '#07090d');
    drawGlowOrb(ctx, 800, 300, 500, 'rgba(232, 201, 135, ALPHA)', 0.18);
    drawGlowOrb(ctx, 1300, 500, 400, 'rgba(200, 241, 105, ALPHA)', 0.18);

    // Layered Salem hills silhouettes
    ctx.fillStyle = 'rgba(16, 23, 34, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    for (let x = 0; x <= 1600; x += 50) {
      const y = 520 - Math.sin(x / 240) * 80 - Math.cos(x / 120) * 35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1600, 800);
    ctx.fill();

    ctx.fillStyle = 'rgba(11, 16, 24, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, 800);
    for (let x = 0; x <= 1600; x += 50) {
      const y = 620 - Math.sin(x / 180 + 1.2) * 60 - Math.cos(x / 80) * 25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1600, 800);
    ctx.fill();

    drawGrid(ctx, 1600, 800, 70, 0.04);
    await saveCanvasAsWebp(c, 'bg-hero-about.webp');
  }

  // 3. bg-hero-services.webp (1600x800)
  {
    const { c, ctx } = initCanvas(1600, 800);
    drawVGradient(ctx, 1600, 800, '#0c1017', '#07090d');
    drawGlowOrb(ctx, 400, 350, 450, 'rgba(94, 230, 184, ALPHA)', 0.22);
    drawGlowOrb(ctx, 1200, 450, 450, 'rgba(147, 197, 253, ALPHA)', 0.18);
    drawGrid(ctx, 1600, 800, 50, 0.05);

    // Network of wealth planning nodes
    const nodes = [
      [200, 250], [400, 180], [600, 290], [800, 210], [1000, 320], [1200, 220], [1400, 270],
      [300, 500], [550, 580], [850, 480], [1100, 550], [1350, 500]
    ];
    ctx.strokeStyle = 'rgba(94, 230, 184, 0.16)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < nodes.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(nodes[i][0], nodes[i][1]);
      ctx.lineTo(nodes[i+1][0], nodes[i+1][1]);
      ctx.stroke();
    }
    for (const [nx, ny] of nodes) {
      ctx.fillStyle = '#5ee6b8';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    await saveCanvasAsWebp(c, 'bg-hero-services.webp');
  }

  // 4. bg-hero-blog.webp (1600x800)
  {
    const { c, ctx } = initCanvas(1600, 800);
    drawVGradient(ctx, 1600, 800, '#0d1118', '#07090d');
    drawGlowOrb(ctx, 1100, 350, 500, 'rgba(200, 241, 105, ALPHA)', 0.22);
    drawGlowOrb(ctx, 400, 550, 400, 'rgba(232, 201, 135, ALPHA)', 0.16);

    // Candlesticks in background
    for (let x = 80; x < 1550; x += 45) {
      const bh = 60 + Math.sin(x * 12.3) * 120 + 80;
      const by = 700 - bh;
      const isUp = Math.sin(x) > -0.1;
      ctx.fillStyle = isUp ? 'rgba(200, 241, 105, 0.12)' : 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(x, by, 18, bh);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 9, by - 15);
      ctx.lineTo(x + 9, 720);
      ctx.stroke();
    }

    drawGrid(ctx, 1600, 800, 60, 0.04);
    await saveCanvasAsWebp(c, 'bg-hero-blog.webp');
  }

  // 5. bg-hero-contact.webp (1600x800)
  {
    const { c, ctx } = initCanvas(1600, 800);
    drawVGradient(ctx, 1600, 800, '#0c1016', '#07090d');
    drawGlowOrb(ctx, 500, 350, 450, 'rgba(200, 241, 105, ALPHA)', 0.22);
    drawGlowOrb(ctx, 1150, 450, 400, 'rgba(94, 230, 184, ALPHA)', 0.18);

    // Radiating signal circles around Salem office coordinates
    const cx = 1150, cy = 400;
    for (let r = 80; r <= 550; r += 65) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawGrid(ctx, 1600, 800, 50, 0.04);
    await saveCanvasAsWebp(c, 'bg-hero-contact.webp');
  }

  // 6. bg-hero-blogpost.webp (1600x800)
  {
    const { c, ctx } = initCanvas(1600, 800);
    drawVGradient(ctx, 1600, 800, '#0c1119', '#07090d');
    drawGlowOrb(ctx, 800, 350, 500, 'rgba(200, 241, 105, ALPHA)', 0.20);
    drawGrid(ctx, 1600, 800, 60, 0.05);
    await saveCanvasAsWebp(c, 'bg-hero-blogpost.webp');
  }

  // 7. hero-visual.webp (900x1000) - Isometric Wealth Layers
  {
    const { c, ctx } = initCanvas(900, 1000);
    drawGlowOrb(ctx, 450, 500, 350, 'rgba(200, 241, 105, ALPHA)', 0.35);
    drawGlowOrb(ctx, 450, 320, 280, 'rgba(94, 230, 184, ALPHA)', 0.25);

    function drawIso(cx, cy, w, h, depth, topCol, leftCol, rightCol) {
      // Top
      ctx.fillStyle = topCol;
      ctx.beginPath();
      ctx.moveTo(cx, cy - depth);
      ctx.lineTo(cx + w / 2, cy - depth / 2);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - w / 2, cy - depth / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();

      // Left
      ctx.fillStyle = leftCol;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - depth / 2);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w / 2, cy + h - depth / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right
      ctx.fillStyle = rightCol;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w / 2, cy - depth / 2);
      ctx.lineTo(cx + w / 2, cy + h - depth / 2);
      ctx.lineTo(cx, cy + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4 Layers
    drawIso(450, 720, 480, 65, 120, '#1c2636', '#131b26', '#17212e');
    drawIso(450, 590, 420, 65, 105, '#233044', '#17212e', '#1e293a');
    drawIso(450, 460, 350, 65, 90, '#2b3c55', '#1e2b3c', '#243449');
    drawIso(450, 330, 270, 65, 75, '#c8f169', '#a2cb45', '#b5e156');

    // Labels on isometric blocks
    ctx.font = '600 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#07090d';
    ctx.fillText('Stackly Alpha Optimization', 450, 305);

    ctx.fillStyle = '#5ee6b8';
    ctx.fillText('Life Goals Allocation · 2035 - 2045', 450, 425);

    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Core Growth Basket · Nifty 50 & Active', 450, 555);

    ctx.fillStyle = '#8b95a5';
    ctx.fillText('Capital Preservation Layer · Liquid & Debt', 450, 685);

    // Glowing trajectory line
    ctx.strokeStyle = '#c8f169';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(170, 780);
    ctx.bezierCurveTo(280, 680, 340, 500, 450, 410);
    ctx.bezierCurveTo(550, 320, 650, 260, 740, 180);
    ctx.stroke();

    // Floating KPI Card
    ctx.fillStyle = 'rgba(16, 21, 29, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(560, 110, 280, 110, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 11px sans-serif';
    ctx.fillStyle = '#8b95a5';
    ctx.fillText('ANNUALIZED WEALTH IRR', 585, 142);
    ctx.font = '700 28px sans-serif';
    ctx.fillStyle = '#c8f169';
    ctx.fillText('+16.8% CAGR', 585, 182);

    await saveCanvasAsWebp(c, 'hero-visual.webp');
  }

  // 8. goal-home.webp (800x540)
  {
    const { c, ctx } = initCanvas(800, 540);
    drawVGradient(ctx, 800, 540, '#151c27', '#080b10');
    drawGlowOrb(ctx, 400, 220, 280, 'rgba(232, 201, 135, ALPHA)', 0.35);

    // Architecture Villa
    ctx.fillStyle = '#182230';
    ctx.fillRect(200, 220, 260, 200);
    ctx.fillStyle = '#121a26';
    ctx.fillRect(420, 260, 180, 160);
    ctx.fillStyle = '#1f2d40';
    ctx.fillRect(240, 160, 160, 60);

    // Warm lit windows
    ctx.fillStyle = 'rgba(232, 201, 135, 0.85)';
    ctx.fillRect(230, 250, 80, 90);
    ctx.fillRect(340, 250, 90, 90);
    ctx.fillStyle = 'rgba(200, 241, 105, 0.7)';
    ctx.fillRect(460, 290, 100, 80);

    // Ground
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 420);
    ctx.lineTo(720, 420);
    ctx.stroke();

    // Goal Tag
    ctx.fillStyle = 'rgba(16, 21, 29, 0.92)';
    ctx.beginPath();
    ctx.roundRect(70, 50, 360, 90, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = '#e8c987';
    ctx.fillText('HOME PURCHASE GOAL', 95, 80);
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Target: ₹1.25 Cr by 2030', 95, 114);

    await saveCanvasAsWebp(c, 'goal-home.webp');
  }

  // 9. goal-education.webp (800x540)
  {
    const { c, ctx } = initCanvas(800, 540);
    drawVGradient(ctx, 800, 540, '#131b26', '#080b10');
    drawGlowOrb(ctx, 400, 260, 280, 'rgba(147, 197, 253, ALPHA)', 0.35);

    // Mortarboard cap
    const cx = 400, cy = 260;
    ctx.fillStyle = '#1c283a';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx + 150, cy - 30);
    ctx.lineTo(cx, cy + 20);
    ctx.lineTo(cx - 150, cy - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tassel
    ctx.strokeStyle = '#c8f169';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx + 160, cy + 30);
    ctx.stroke();

    // Stacked books
    ctx.fillStyle = '#162130';
    ctx.fillRect(260, 360, 280, 35);
    ctx.fillStyle = '#1d2c40';
    ctx.fillRect(240, 395, 320, 40);

    // Goal Tag
    ctx.fillStyle = 'rgba(16, 21, 29, 0.92)';
    ctx.beginPath();
    ctx.roundRect(70, 50, 380, 90, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('CHILD HIGHER EDUCATION', 95, 80);
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Target: ₹85 Lakhs by 2036', 95, 114);

    await saveCanvasAsWebp(c, 'goal-education.webp');
  }

  // 10. goal-retirement.webp (800x540)
  {
    const { c, ctx } = initCanvas(800, 540);
    drawVGradient(ctx, 800, 540, '#171a22', '#080a0e');
    drawGlowOrb(ctx, 400, 230, 320, 'rgba(232, 201, 135, ALPHA)', 0.40);
    drawGlowOrb(ctx, 400, 310, 220, 'rgba(200, 241, 105, ALPHA)', 0.25);

    // Glowing sun
    ctx.fillStyle = 'rgba(232, 201, 135, 0.9)';
    ctx.beginPath();
    ctx.arc(400, 240, 60, 0, Math.PI * 2);
    ctx.fill();

    // Hills
    ctx.fillStyle = '#0f141c';
    ctx.beginPath();
    ctx.moveTo(0, 540);
    for (let x = 0; x <= 800; x += 30) {
      const y = 370 - Math.sin(x / 140) * 40 - Math.cos(x / 70) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(800, 540);
    ctx.fill();

    // Goal Tag
    ctx.fillStyle = 'rgba(16, 21, 29, 0.92)';
    ctx.beginPath();
    ctx.roundRect(70, 50, 380, 90, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = '#c8f169';
    ctx.fillText('SALEM RETIREMENT FREEDOM', 95, 80);
    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Target: ₹3.50 Cr by 2045', 95, 114);

    await saveCanvasAsWebp(c, 'goal-retirement.webp');
  }

  // 11. salem-map.webp (900x420)
  {
    const { c, ctx } = initCanvas(900, 420);
    drawVGradient(ctx, 900, 420, '#111722', '#080b10');

    // Grid roads
    drawGrid(ctx, 900, 420, 60, 0.06);

    // Highways
    ctx.strokeStyle = 'rgba(200, 241, 105, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 380);
    ctx.lineTo(450, 210);
    ctx.lineTo(800, 120);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(94, 230, 184, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(250, 40);
    ctx.lineTo(450, 210);
    ctx.lineTo(650, 400);
    ctx.stroke();

    // Pin
    drawGlowOrb(ctx, 450, 210, 100, 'rgba(200, 241, 105, ALPHA)', 0.6);
    ctx.fillStyle = '#c8f169';
    ctx.beginPath();
    ctx.arc(450, 210, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07090d';
    ctx.beginPath();
    ctx.arc(450, 210, 8, 0, Math.PI * 2);
    ctx.fill();

    // Map Card
    ctx.fillStyle = 'rgba(16, 21, 29, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(320, 260, 260, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '700 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STACKLY WEALTH SALEM', 450, 295);
    ctx.font = '500 13px sans-serif';
    ctx.fillStyle = '#c8f169';
    ctx.fillText('Salem Central Advisory Desk', 450, 325);

    await saveCanvasAsWebp(c, 'salem-map.webp');
  }

  // 12. about-salem.webp (900x600)
  {
    const { c, ctx } = initCanvas(900, 600);
    drawVGradient(ctx, 900, 600, '#141c28', '#080b10');
    drawGlowOrb(ctx, 450, 260, 320, 'rgba(94, 230, 184, ALPHA)', 0.25);

    // Distant Yercaud hills
    ctx.fillStyle = '#111722';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    for (let x = 0; x <= 900; x += 40) {
      const y = 320 - Math.sin(x / 200) * 60 - Math.cos(x / 90) * 25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(900, 600);
    ctx.fill();

    // Modern glass building
    ctx.fillStyle = '#172230';
    ctx.fillRect(340, 180, 220, 320);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(340, 180, 220, 320);

    for (let y = 210; y < 480; y += 35) {
      ctx.beginPath(); ctx.moveTo(340, y); ctx.lineTo(560, y); ctx.stroke();
    }
    for (let x = 375; x < 540; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 180); ctx.lineTo(x, 500); ctx.stroke();
    }

    // Title Tag
    ctx.fillStyle = 'rgba(16, 21, 29, 0.95)';
    ctx.beginPath();
    ctx.roundRect(260, 50, 380, 85, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = '#c8f169';
    ctx.fillText('DISCIPLINED WEALTH ADVISORY', 450, 78);
    ctx.font = '600 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Built For Salem Families', 450, 108);

    await saveCanvasAsWebp(c, 'about-salem.webp');
  }

  // 13. thumb-funds.webp (700x480)
  {
    const { c, ctx } = initCanvas(700, 480);
    drawVGradient(ctx, 700, 480, '#141c28', '#080b10');
    drawGlowOrb(ctx, 350, 220, 220, 'rgba(200, 241, 105, ALPHA)', 0.35);

    const cx = 350, cy = 210, rOut = 130, rIn = 75;
    function drawDonutSlice(startDeg, endDeg, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, (startDeg - 90) * Math.PI / 180, (endDeg - 90) * Math.PI / 180);
      ctx.arc(cx, cy, rIn, (endDeg - 90) * Math.PI / 180, (startDeg - 90) * Math.PI / 180, true);
      ctx.closePath();
      ctx.fill();
    }
    drawDonutSlice(0, 160, '#c8f169');
    drawDonutSlice(160, 250, '#5ee6b8');
    drawDonutSlice(250, 320, '#e8c987');
    drawDonutSlice(320, 360, '#93c5fd');

    ctx.textAlign = 'center';
    ctx.font = '700 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('100%', cx, cy - 5);
    ctx.font = '600 11px sans-serif';
    ctx.fillStyle = '#8b95a5';
    ctx.fillText('ALLOCATED', cx, cy + 18);

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Diversified Mutual Fund Basket', cx, 410);

    await saveCanvasAsWebp(c, 'thumb-funds.webp');
  }

  // 14. thumb-sip.webp (700x480)
  {
    const { c, ctx } = initCanvas(700, 480);
    drawVGradient(ctx, 700, 480, '#141c28', '#080b10');
    drawGlowOrb(ctx, 350, 220, 220, 'rgba(94, 230, 184, ALPHA)', 0.35);

    const bars = [60, 95, 140, 195, 260, 340];
    const bw = 48, startX = 130;
    for (let i = 0; i < bars.length; i++) {
      const bx = startX + i * 80;
      const by = 370 - bars[i];
      ctx.fillStyle = '#1e2c3d';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bars[i], 8);
      ctx.fill();
      ctx.fillStyle = '#5ee6b8';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 14, 6);
      ctx.fill();
    }

    ctx.strokeStyle = '#c8f169';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < bars.length; i++) {
      const bx = startX + i * 80 + bw / 2;
      const by = 370 - bars[i];
      if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
    }
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Disciplined Monthly SIP Compounding', 350, 420);

    await saveCanvasAsWebp(c, 'thumb-sip.webp');
  }

  // 15. thumb-tax.webp (700x480)
  {
    const { c, ctx } = initCanvas(700, 480);
    drawVGradient(ctx, 700, 480, '#141c28', '#080b10');
    drawGlowOrb(ctx, 350, 210, 220, 'rgba(232, 201, 135, ALPHA)', 0.35);

    // Document
    ctx.fillStyle = '#1a2433';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(240, 80, 220, 270, 12);
    ctx.fill();
    ctx.stroke();

    for (let y = 130; y < 310; y += 26) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(270, y, 160, 4);
    }

    // Gold % badge
    ctx.fillStyle = '#e8c987';
    ctx.beginPath();
    ctx.arc(350, 210, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '700 42px sans-serif';
    ctx.fillStyle = '#07090d';
    ctx.fillText('%', 350, 225);

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Tax-Smart Wealth Optimization', 350, 410);

    await saveCanvasAsWebp(c, 'thumb-tax.webp');
  }

  // 16. thumb-emergency.webp (700x480)
  {
    const { c, ctx } = initCanvas(700, 480);
    drawVGradient(ctx, 700, 480, '#141c28', '#080b10');
    drawGlowOrb(ctx, 350, 210, 220, 'rgba(94, 230, 184, ALPHA)', 0.35);

    // Shield
    const cx = 350, cy = 200;
    ctx.fillStyle = '#1b2636';
    ctx.strokeStyle = '#5ee6b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 90);
    ctx.lineTo(cx + 85, cy - 50);
    ctx.lineTo(cx + 65, cy + 45);
    ctx.lineTo(cx, cy + 105);
    ctx.lineTo(cx - 65, cy + 45);
    ctx.lineTo(cx - 85, cy - 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Checkmark
    ctx.strokeStyle = '#c8f169';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 5);
    ctx.lineTo(cx - 10, cy + 32);
    ctx.lineTo(cx + 35, cy - 22);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Emergency Reserve & Liquid Capital', 350, 410);

    await saveCanvasAsWebp(c, 'thumb-emergency.webp');
  }

  // 17. thumb-business.webp (700x480)
  {
    const { c, ctx } = initCanvas(700, 480);
    drawVGradient(ctx, 700, 480, '#141c28', '#080b10');
    drawGlowOrb(ctx, 350, 210, 220, 'rgba(147, 197, 253, ALPHA)', 0.35);

    // Commercial buildings
    ctx.fillStyle = '#172230';
    ctx.fillRect(200, 160, 110, 200);
    ctx.fillStyle = '#1e2c3e';
    ctx.fillRect(330, 110, 130, 250);
    ctx.fillStyle = '#151e2b';
    ctx.fillRect(480, 180, 90, 180);

    // Rupee Coin
    ctx.fillStyle = '#e8c987';
    ctx.beginPath();
    ctx.arc(480, 130, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07090d';
    ctx.textAlign = 'center';
    ctx.font = '700 36px sans-serif';
    ctx.fillText('₹', 480, 142);

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#eef1f5';
    ctx.fillText('Business Treasury & Enterprise Wealth', 350, 410);

    await saveCanvasAsWebp(c, 'thumb-business.webp');
  }

  console.log('Finished rendering all 17 assets!');
}

window.addEventListener('load', renderAll);
</script>
</body>
</html>`;
