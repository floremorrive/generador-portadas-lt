// Motor de render: dibuja Portada (1800x1200) y Miniatura (1200x628) en <canvas>.

const PORTADA_W = 1800;
const PORTADA_H = 1200;
const MINI_W = 1200;
const MINI_H = 628;

const COLORS = {
  paper: '#DEDEDE',
  maroonBacking: '#803A32',
  negra: '#0A0A0A',
  gold: '#C6A16A',
  credit: '#FFFFFF',
};

const ASSETS = {
  lineas: 'assets/img/Sombra-lineas.png',
  lineas2: 'assets/img/Sombra-lineas2.png',
  ruido2: 'assets/img/Sombra-ruido2.png',
  logo: 'assets/img/logo-latribuna.png',
  barraDorada: 'assets/img/barra-dorada.png',
};

const imageCache = {};
function loadImage(src) {
  if (imageCache[src]) return imageCache[src];
  imageCache[src] = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  return imageCache[src];
}

async function preloadAssets() {
  const entries = Object.entries(ASSETS);
  await Promise.all(entries.map(([, src]) => loadImage(src)));
}

// Recolorea un logo (con transparencia) a un color sólido, preservando su alfa.
function recolorImage(img, color) {
  const off = document.createElement('canvas');
  off.width = img.width;
  off.height = img.height;
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = color;
  octx.fillRect(0, 0, off.width, off.height);
  return off;
}

// Dibuja una imagen (foto o textura) con ajuste tipo "cover" centrado, sin recorte manual.
function drawCoverCentered(ctx, img, dx, dy, dw, dh) {
  const srcRatio = img.width / img.height;
  const dstRatio = dw / dh;
  let sw, sh, sx, sy;
  if (srcRatio > dstRatio) {
    sh = img.height;
    sw = sh * dstRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / dstRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Dibuja la foto del usuario tipo "cover" con foco/zoom ajustable (focalX/focalY en 0..1, zoom>=1).
function drawPhotoFocal(ctx, img, dx, dy, dw, dh, focal) {
  const { zoom = 1, focalX = 0.5, focalY = 0.5 } = focal || {};
  const dstRatio = dw / dh;
  // tamaño base "cover" (ratio 1) y luego se reduce por el zoom (zoom>1 = acerca)
  let baseW, baseH;
  if (img.width / img.height > dstRatio) {
    baseH = img.height;
    baseW = baseH * dstRatio;
  } else {
    baseW = img.width;
    baseH = baseW / dstRatio;
  }
  const sw = baseW / zoom;
  const sh = baseH / zoom;
  let sx = focalX * img.width - sw / 2;
  let sy = focalY * img.height - sh / 2;
  sx = Math.max(0, Math.min(img.width - sw, sx));
  sy = Math.max(0, Math.min(img.height - sh, sy));
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Respaldo oscuro semitransparente: garantiza contraste sin importar qué tan clara sea la foto de fondo
// (una sombra difusa sola no alcanza sobre blanco puro).
function drawBacking(ctx, x, y, w, h, radius = 8, color = 'rgba(0,0,0,0.55)') {
  ctx.save();
  ctx.fillStyle = color;
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
}

function drawCreditText(ctx, text, x, y, opts = {}) {
  if (!text) return;
  const { size = 26, align = 'left', color = COLORS.credit, font = "'Inter Tight', sans-serif", backing = true } = opts;
  ctx.save();
  ctx.font = `500 ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';

  if (backing) {
    const w = ctx.measureText(text).width;
    const padX = size * 0.5;
    const padTop = size * 0.78;
    const padBottom = size * 0.32;
    let bx = x - padX;
    if (align === 'center') bx = x - w / 2 - padX;
    else if (align === 'right') bx = x - w - padX;
    drawBacking(ctx, bx, y - padTop, w + padX * 2, padTop + padBottom, (padTop + padBottom) / 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

async function dibujarPortada(canvas, { photo, credito, focal }) {
  canvas.width = PORTADA_W;
  canvas.height = PORTADA_H;
  const ctx = canvas.getContext('2d');
  await preloadAssets();

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, PORTADA_W, PORTADA_H);

  if (photo) {
    drawPhotoFocal(ctx, photo, 0, 0, PORTADA_W, PORTADA_H, focal);
  }

  const lineas = await loadImage(ASSETS.lineas);
  drawCoverCentered(ctx, lineas, 0, 0, PORTADA_W, PORTADA_H);
  const lineas2 = await loadImage(ASSETS.lineas2);
  drawCoverCentered(ctx, lineas2, 0, 0, PORTADA_W, PORTADA_H);

  drawCreditText(ctx, credito, 44, PORTADA_H - 40, { size: 30 });

  const logo = await loadImage(ASSETS.logo);
  const logoWhite = recolorImage(logo, '#FFFFFF');
  const logoH = 70;
  const logoW = logoH * (logo.width / logo.height);
  const logoX = PORTADA_W - logoW - 44;
  const logoY = PORTADA_H - logoH - 36;
  ctx.drawImage(logoWhite, logoX, logoY, logoW, logoH);
}

// 1cm ~ 32px a este tamaño de lienzo (aproximado; ajustable si no coincide con el original).
const PX_POR_CM = 32;

const VARIANTES_MINI = {
  roja: {
    margenTB: 2 * PX_POR_CM,
    margenDerecha: 1 * PX_POR_CM,
    sobresale: 4 * PX_POR_CM,
    dorado: false,
  },
  negra: {
    margenTB: 3 * PX_POR_CM,
    margenDerecha: 1 * PX_POR_CM,
    sobresale: 2 * PX_POR_CM,
    dorado: true,
    doradoGap: 1 * PX_POR_CM,
  },
};

async function dibujarMiniatura(canvas, { photo, credito, focal, variante = 'negra' }) {
  canvas.width = MINI_W;
  canvas.height = MINI_H;
  const ctx = canvas.getContext('2d');
  await preloadAssets();

  // El negro/rojo ocupa la mitad de la plantilla; el panel del logo la otra mitad.
  const logoPanelW = Math.round(MINI_W * 0.5);
  const matColor = variante === 'roja' ? COLORS.maroonBacking : COLORS.negra;
  const cfg = VARIANTES_MINI[variante] || VARIANTES_MINI.negra;

  ctx.clearRect(0, 0, MINI_W, MINI_H);

  // Panel del logo (izquierda, a sangre en las 4 posiciones: alto completo, pegado a la izquierda)
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, logoPanelW, MINI_H);
  const ruido2 = await loadImage(ASSETS.ruido2);
  drawCoverCentered(ctx, ruido2, 0, 0, logoPanelW, MINI_H);
  const lineas2 = await loadImage(ASSETS.lineas2);
  drawCoverCentered(ctx, lineas2, 0, 0, logoPanelW, MINI_H);

  const logo = await loadImage(ASSETS.logo);
  const logoW = logoPanelW * 0.50;
  const logoH = logoW * (logo.height / logo.width);
  // Alineado hacia la izquierda del panel (no centrado): deja el aire hacia la foto, no pegado a ella.
  const logoX = logoPanelW * 0.08 + 1 * PX_POR_CM;
  ctx.drawImage(logo, logoX, (MINI_H - logoH) / 2, logoW, logoH);

  const lineas = await loadImage(ASSETS.lineas);

  // Mate (negro o rojo) a sangre: ocupa la mitad derecha completa (top/right/bottom pegados al lienzo).
  ctx.fillStyle = matColor;
  ctx.fillRect(logoPanelW, 0, MINI_W - logoPanelW, MINI_H);

  // La foto se monta encima del mate, un poco más chica (deja ver el mate arriba/abajo/derecha,
  // con margen derecho más angosto que el de arriba/abajo) y desplazada hacia la izquierda
  // para sobresalir sobre el panel blanco.
  const overflow = cfg.sobresale;
  const photoX = logoPanelW - overflow;
  const photoY = cfg.margenTB;
  const photoRight = MINI_W - cfg.margenDerecha;
  const photoW = photoRight - photoX;
  const photoH = MINI_H - cfg.margenTB * 2;

  if (photo) drawPhotoFocal(ctx, photo, photoX, photoY, photoW, photoH, focal);
  drawCoverCentered(ctx, lineas, photoX, photoY, photoW, photoH);
  drawCoverCentered(ctx, lineas2, photoX, photoY, photoW, photoH);

  // El crédito va en la banda de color de abajo (mate), NO sobre la foto.
  // OJO: photoX puede caer a la izquierda de logoPanelW (por el sobresaliente), y ahí el
  // fondo real es el panel blanco, no el mate — por eso el texto arranca en logoPanelW, no en photoX.
  const creditoSize = 17;
  const bandaInferiorY = photoY + photoH;
  const creditoY = bandaInferiorY + cfg.margenTB / 2 + creditoSize * 0.35;
  const creditoX = Math.max(photoX, logoPanelW) + 12;
  // Sin respaldo: aquí el crédito ya cae sobre el mate sólido, un respaldo extra se ve postizo.
  drawCreditText(ctx, credito, creditoX, creditoY, { size: creditoSize, backing: false });

  if (cfg.dorado) {
    // Barra dorada en el panel blanco, a 1cm de distancia del borde de la foto.
    const barW = 8;
    const barRightX = photoX - cfg.doradoGap;
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(barRightX - barW, photoY, barW, photoH);
  }
}

// Exporta el canvas a WebP, bajando calidad (y si hace falta, tamaño) hasta quedar bajo maxBytes.
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function exportarWebp(canvas, maxBytes = 100 * 1024) {
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, 'image/webp', quality);
  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, 'image/webp', quality);
  }
  if (blob.size <= maxBytes) return blob;

  // Si al piso de calidad sigue pesando de más, reducimos el lienzo y reintentamos.
  let scale = 0.9;
  let work = canvas;
  while (blob.size > maxBytes && scale > 0.4) {
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    scaled.getContext('2d').drawImage(canvas, 0, 0, scaled.width, scaled.height);
    work = scaled;
    quality = 0.85;
    blob = await canvasToBlob(work, 'image/webp', quality);
    while (blob.size > maxBytes && quality > 0.4) {
      quality -= 0.08;
      blob = await canvasToBlob(work, 'image/webp', quality);
    }
    scale -= 0.1;
  }
  return blob;
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
