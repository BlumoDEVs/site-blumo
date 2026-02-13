(() => {
  const root = document.querySelector('[data-bpe-configurator]');
  if (!root || !window.bpeConfig) return;

  const schema = JSON.parse(root.getAttribute('data-schema'));
  const fieldsWrap = root.querySelector('[data-bpe-fields]');
  const priceEl = root.querySelector('[data-bpe-price]');
  const leadTimeEl = root.querySelector('[data-bpe-lead-time]');
  const selectionField = root.querySelector('[data-bpe-selection-field]');

  const selection = { size: 'A5', people: '1', background: 'clean', addons: [] };
  const track = (event, payload = {}) => window.blumoTrack?.(event, payload);

  const buildSelect = (label, key, options) => {
    const id = `bpe_${key}`;
    const wrap = document.createElement('label');
    wrap.innerHTML = `<span>${label}</span><select id="${id}"></select>`;
    const select = wrap.querySelector('select');
    Object.keys(options).forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    select.value = selection[key];
    select.addEventListener('change', () => {
      selection[key] = select.value;
      track('configurator_option_changed', { key, value: select.value });
      refreshQuote();
    });
    return wrap;
  };

  fieldsWrap.appendChild(buildSelect('Tamanho', 'size', schema.sizes));
  fieldsWrap.appendChild(buildSelect('Pessoas', 'people', schema.people));
  fieldsWrap.appendChild(buildSelect('Fundo', 'background', schema.background));

  const addonWrap = document.createElement('div');
  addonWrap.innerHTML = '<span>Add-ons</span>';
  Object.entries(schema.addons).forEach(([key, item]) => {
    const lbl = document.createElement('label');
    lbl.innerHTML = `<input type="checkbox" value="${key}"/> ${item.label}`;
    const cb = lbl.querySelector('input');
    cb.addEventListener('change', () => {
      selection.addons = [...addonWrap.querySelectorAll('input:checked')].map((el) => el.value);
      track('configurator_option_changed', { key: 'addons', value: selection.addons });
      refreshQuote();
    });
    addonWrap.appendChild(lbl);
  });
  fieldsWrap.appendChild(addonWrap);

  const refreshQuote = async () => {
    selectionField.value = JSON.stringify(selection);
    const response = await fetch(`${bpeConfig.restUrl}price-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': bpeConfig.nonce,
      },
      body: JSON.stringify({ product_id: bpeConfig.product, selection }),
    });
    const data = await response.json();
    priceEl.textContent = `${bpeConfig.currencySymbol}${data.price}`;
    leadTimeEl.textContent = `${data.lead_time_days} dias`;
  };

  refreshQuote();

  const uploadInput = document.querySelector('input[name="bpe_photo"]');
  const qualityOutput = document.querySelector('[data-bpe-quality-report]');
  const qualityField = document.querySelector('[data-bpe-quality-score]');

  const qualityScore = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(img.width, 800);
    canvas.height = Math.min(img.height, 800);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let edges = 0;
    for (let i = 0; i < data.length - 16; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const nextLum = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
      edges += Math.abs(lum - nextLum);
    }

    const sharpness = Math.min(40, Math.round(edges / (canvas.width * canvas.height)));
    const resScore = img.width >= 1800 && img.height >= 1800 ? 40 : 20;
    const ratio = img.width / img.height;
    const ratioScore = ratio > 0.6 && ratio < 1.8 ? 20 : 8;
    return Math.max(0, Math.min(100, sharpness + resScore + ratioScore));
  };

  uploadInput?.addEventListener('change', () => {
    const file = uploadInput.files?.[0];
    if (!file) return;
    track('upload_started', { file_type: file.type, size: file.size });

    const img = new Image();
    img.onload = () => {
      const score = qualityScore(img);
      qualityField.value = String(score);
      qualityOutput.innerHTML = `Quality Score: <strong>${score}</strong>/100`;
      track('upload_completed', { quality_score: score });
    };
    img.onerror = () => track('upload_failed', { reason: 'decode_error' });
    img.src = URL.createObjectURL(file);
  });

  document.querySelector('.single_add_to_cart_button')?.addEventListener('click', () => track('add_to_cart_clicked'));
})();
