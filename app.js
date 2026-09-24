const logoUrl = 'arzhost-logo-white-2048x431.png';
const state = { items: [], converted: [] };

const $ = (selector) => document.querySelector(selector);
const els = {
  dropZone: $('#dropZone'), fileInput: $('#fileInput'), editor: $('#editor'),
  fileGrid: $('#fileGrid'), fileCount: $('#fileCount'), addMore: $('#addMore'),
  clearAll: $('#clearAll'), convertAll: $('#convertAll'), progressArea: $('#progressArea'),
  progressBar: $('#progressBar'), progressText: $('#progressText'), progressNumber: $('#progressNumber'),
  completeArea: $('#completeArea'), downloadAll: $('#downloadAll'), savingSummary: $('#savingSummary'),
  quality: $('#quality'), qualityValue: $('#qualityValue'), opacity: $('#opacity'),
  opacityValue: $('#opacityValue'), logoSize: $('#logoSize'), logoSizeValue: $('#logoSizeValue'), toast: $('#toast')
};

const formatBytes = (bytes) => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(1)} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function acceptFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith('image/'));
  if (!images.length) return showToast('Please select valid image files.');
  images.forEach((file) => state.items.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
  state.converted = [];
  render();
}

function render() {
  const hasFiles = state.items.length > 0;
  els.dropZone.hidden = hasFiles;
  els.editor.hidden = !hasFiles;
  els.fileCount.textContent = state.items.length;
  els.completeArea.hidden = true;
  els.progressArea.hidden = true;
  els.fileGrid.innerHTML = '';

  state.items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'file-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      <img src="${item.url}" alt="Preview of ${escapeHtml(item.file.name)}">
      <button class="remove-file" type="button" aria-label="Remove ${escapeHtml(item.file.name)}">×</button>
      <div class="file-meta"><strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong><span>${formatBytes(item.file.size)}</span></div>`;
    card.querySelector('button').addEventListener('click', () => removeItem(item.id));
    els.fileGrid.append(card);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function removeItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (item) URL.revokeObjectURL(item.url);
  state.items = state.items.filter((entry) => entry.id !== id);
  state.converted = [];
  render();
}

function clearAll() {
  state.items.forEach((item) => URL.revokeObjectURL(item.url));
  state.items = [];
  state.converted = [];
  els.fileInput.value = '';
  render();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('WebP conversion is not supported in this browser.')),
    'image/webp', quality
  ));
}

async function convertItem(item, logo) {
  const image = await loadImage(item.url);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const targetWidth = canvas.width * (Number(els.logoSize.value) / 100);
  const targetHeight = targetWidth * (logo.naturalHeight / logo.naturalWidth);
  const padding = Math.max(10, canvas.width * .025);
  const platePadX = targetWidth * .12;
  const platePadY = targetHeight * .28;
  const x = canvas.width - targetWidth - padding;
  const y = canvas.height - targetHeight - padding;

  ctx.save();
  ctx.globalAlpha = Number(els.opacity.value) / 100;
  ctx.fillStyle = 'rgba(8, 13, 28, .68)';
  roundedRect(ctx, x - platePadX, y - platePadY, targetWidth + platePadX * 2, targetHeight + platePadY * 2, Math.max(6, targetHeight * .18));
  ctx.fill();
  ctx.drawImage(logo, x, y, targetWidth, targetHeight);
  ctx.restore();

  const blob = await canvasToBlob(canvas, Number(els.quality.value) / 100);
  const baseName = item.file.name.replace(/\.[^.]+$/, '') || 'image';
  return { name: `${baseName}.webp`, blob, originalSize: item.file.size };
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

async function convertAll() {
  if (!state.items.length) return;
  els.convertAll.disabled = true;
  els.completeArea.hidden = true;
  els.progressArea.hidden = false;
  state.converted = [];

  try {
    const logo = await loadImage(logoUrl);
    for (let index = 0; index < state.items.length; index += 1) {
      els.progressText.textContent = `Converting ${state.items[index].file.name}`;
      state.converted.push(await convertItem(state.items[index], logo));
      const percent = Math.round(((index + 1) / state.items.length) * 100);
      els.progressBar.value = percent;
      els.progressNumber.textContent = `${percent}%`;
      els.fileGrid.querySelector(`[data-id="${state.items[index].id}"]`)?.classList.add('done');
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    const before = state.converted.reduce((sum, item) => sum + item.originalSize, 0);
    const after = state.converted.reduce((sum, item) => sum + item.blob.size, 0);
    const saving = before > after ? `${Math.round((1 - after / before) * 100)}% smaller · ${formatBytes(after)} total` : `${formatBytes(after)} total`;
    els.savingSummary.textContent = saving;
    els.completeArea.hidden = false;
    els.progressText.textContent = 'Conversion complete';
  } catch (error) {
    showToast(error.message || 'One of the images could not be converted.');
  } finally {
    els.convertAll.disabled = false;
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadAll() {
  if (!state.converted.length) return;
  els.downloadAll.disabled = true;
  els.downloadAll.textContent = 'Preparing ZIP…';
  try {
    const entries = await Promise.all(state.converted.map(async (item) => ({ name: item.name, data: new Uint8Array(await item.blob.arrayBuffer()) })));
    downloadBlob(createZip(entries), `arz-webp-images-${new Date().toISOString().slice(0, 10)}.zip`);
  } finally {
    els.downloadAll.disabled = false;
    els.downloadAll.textContent = 'Download all (.zip)';
  }
}

function createZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach(({ name, data }) => {
    const fileName = encoder.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + fileName.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, fileName.length, true);
    local.set(fileName, 30);
    local.set(data, 30 + fileName.length);
    localParts.push(local);

    const central = new Uint8Array(46 + fileName.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, fileName.length, true);
    centralView.setUint32(42, offset, true);
    central.set(fileName, 46);
    centralParts.push(central);
    offset += local.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let k = 0; k < 8; k += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) crc = crcTable[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

els.dropZone.addEventListener('click', () => els.fileInput.click());
els.dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); els.fileInput.click(); }
});
els.dropZone.addEventListener('dragover', (event) => { event.preventDefault(); els.dropZone.classList.add('dragging'); });
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragging'));
els.dropZone.addEventListener('drop', (event) => { event.preventDefault(); els.dropZone.classList.remove('dragging'); acceptFiles(event.dataTransfer.files); });
els.fileInput.addEventListener('change', () => { acceptFiles(els.fileInput.files); els.fileInput.value = ''; });
els.addMore.addEventListener('click', () => els.fileInput.click());
els.clearAll.addEventListener('click', clearAll);
els.convertAll.addEventListener('click', convertAll);
els.downloadAll.addEventListener('click', downloadAll);
els.quality.addEventListener('input', () => { els.qualityValue.textContent = `${els.quality.value}%`; state.converted = []; els.completeArea.hidden = true; });
els.opacity.addEventListener('input', () => { els.opacityValue.textContent = `${els.opacity.value}%`; state.converted = []; els.completeArea.hidden = true; });
els.logoSize.addEventListener('input', () => { els.logoSizeValue.textContent = `${els.logoSize.value}%`; state.converted = []; els.completeArea.hidden = true; });
