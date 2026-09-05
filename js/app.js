const estado = {
  photo: null,
  focal: { zoom: 1, focalX: 0.5, focalY: 0.5 },
  credito: '',
  variante: 'negra',
  vista: 'portada',
};

const previewCanvas = document.getElementById('canvas-preview');
const previewWrap = document.getElementById('preview-wrap');
const exportCanvas = document.getElementById('canvas-export');
const elEstado = document.getElementById('estado');

function setEstado(msg) { elEstado.textContent = msg || ''; }

async function actualizarPreview() {
  if (estado.vista === 'portada') {
    await dibujarPortada(previewCanvas, { photo: estado.photo, credito: estado.credito, focal: estado.focal });
  } else if (estado.vista === 'puntos-vista') {
    await dibujarPuntosVista(previewCanvas, { photo: estado.photo, focal: estado.focal });
  } else {
    await dibujarMiniatura(previewCanvas, {
      photo: estado.photo,
      credito: estado.credito,
      focal: estado.focal,
      variante: estado.variante,
    });
  }
}

document.getElementById('input-foto').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    estado.photo = img;
    estado.focal = { zoom: 1, focalX: 0.5, focalY: 0.5 };
    document.getElementById('input-zoom').value = 1;
    await actualizarPreview();
  };
  img.src = url;
});

document.getElementById('input-zoom').addEventListener('input', async (e) => {
  estado.focal.zoom = parseFloat(e.target.value);
  await actualizarPreview();
});

document.getElementById('input-credito').addEventListener('input', async (e) => {
  estado.credito = e.target.value;
  await actualizarPreview();
});

document.querySelectorAll('input[name="variante"]').forEach((r) => {
  r.addEventListener('change', async (e) => {
    estado.variante = e.target.value;
    if (estado.vista === 'miniatura') await actualizarPreview();
  });
});

document.querySelectorAll('input[name="vista"]').forEach((r) => {
  r.addEventListener('change', async (e) => {
    estado.vista = e.target.value;
    await actualizarPreview();
  });
});

// Arrastrar la foto en la vista previa para reencuadrar (mueve el foco normalizado).
let arrastrando = false;
let inicio = { x: 0, y: 0, focalX: 0.5, focalY: 0.5 };

previewWrap.addEventListener('mousedown', (e) => {
  if (!estado.photo) return;
  arrastrando = true;
  previewWrap.classList.add('arrastrando');
  inicio = { x: e.clientX, y: e.clientY, focalX: estado.focal.focalX, focalY: estado.focal.focalY };
});

window.addEventListener('mousemove', async (e) => {
  if (!arrastrando) return;
  const rect = previewWrap.getBoundingClientRect();
  const dx = (e.clientX - inicio.x) / rect.width;
  const dy = (e.clientY - inicio.y) / rect.height;
  estado.focal.focalX = Math.max(0, Math.min(1, inicio.focalX - dx));
  estado.focal.focalY = Math.max(0, Math.min(1, inicio.focalY - dy));
  await actualizarPreview();
});

window.addEventListener('mouseup', () => {
  arrastrando = false;
  previewWrap.classList.remove('arrastrando');
});

document.getElementById('btn-portada').addEventListener('click', async () => {
  setEstado('Generando portada…');
  await dibujarPortada(exportCanvas, { photo: estado.photo, credito: estado.credito, focal: estado.focal });
  const blob = await exportarWebp(exportCanvas, 100 * 1024);
  descargarBlob(blob, 'portada.webp');
  setEstado(`Portada lista (${Math.round(blob.size / 1024)} KB).`);
});

document.getElementById('btn-miniatura').addEventListener('click', async () => {
  setEstado('Generando miniatura…');
  await dibujarMiniatura(exportCanvas, {
    photo: estado.photo,
    credito: estado.credito,
    focal: estado.focal,
    variante: estado.variante,
  });
  const blob = await exportarWebp(exportCanvas, 100 * 1024);
  descargarBlob(blob, `miniatura-${estado.variante}.webp`);
  setEstado(`Miniatura ${estado.variante} lista (${Math.round(blob.size / 1024)} KB).`);
});

document.getElementById('btn-puntos-vista').addEventListener('click', async () => {
  setEstado('Generando miniatura Puntos de vista…');
  await dibujarPuntosVista(exportCanvas, { photo: estado.photo, focal: estado.focal });
  const blob = await exportarWebp(exportCanvas, 100 * 1024);
  descargarBlob(blob, 'miniatura-puntos-de-vista.webp');
  setEstado(`Miniatura Puntos de vista lista (${Math.round(blob.size / 1024)} KB).`);
});

// Primer render (sin foto) para mostrar el layout de una vez.
actualizarPreview();
