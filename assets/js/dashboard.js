(() => {
  const API_BASE = 'https://am.hinatasoft.com';
  const $ = id => document.getElementById(id);
  const titles = {1:'01 / Email',2:'02 / Magic link',3:'03 / Selesai'};

  function setStep(step) {
    for (let i=1;i<=3;i++) {
      $(`p${i}`)?.classList.toggle('hidden', i !== step);
      const guide = $(`guide-${i}`);
      guide?.classList.toggle('active', i === step);
      guide?.classList.toggle('done', i < step);
    }
    if ($('step-title')) $('step-title').textContent = titles[step];
    if ($('progress-copy')) $('progress-copy').textContent = `Langkah ${step} dari 3`;
    const bar = $('progress-bar');
    if (bar) bar.className = `step-${step}`;
  }

  function message(id, text, ok) {
    const el = $(id); if (!el) return;
    el.textContent = text;
    el.className = `message ${ok ? 'ok' : 'err'}`;
  }

  function clearMessage(id) {
    const el = $(id); if (!el) return;
    el.textContent = ''; el.className = 'message';
  }

  function setBusy(button, busy, label, idleLabel) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? label : idleLabel;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {'content-type':'application/json', ...(options.headers || {})}
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request gagal (${response.status})`);
    }
    return data;
  }

  function refreshStats(data) {
    if (!data) return;
    if ($('st-total')) $('st-total').textContent = Number(data.total || 0).toLocaleString('id-ID');
    if ($('st-today')) $('st-today').textContent = Number(data.today || 0).toLocaleString('id-ID');
  }

  async function loadServer() {
    try {
      const data = await request('/api/status');
      const online = data.status === 'online';
      $('server-status')?.classList.toggle('online', online);
      $('server-status')?.classList.toggle('offline', !online);
      if ($('server-status-text')) $('server-status-text').textContent = online ? 'Server online' : 'Server tidak tersedia';
    } catch {
      $('server-status')?.classList.add('offline');
      if ($('server-status-text')) $('server-status-text').textContent = 'Server tidak tersedia';
    }
  }

  async function loadStats() {
    try { refreshStats(await request('/api/stats')); } catch {}
  }

  $('em')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') $('b1')?.click();
  });

  $('b1')?.addEventListener('click', async () => {
    const email = $('em')?.value.trim() || '';
    clearMessage('m1');
    if (!email.includes('@') || !email.includes('.')) {
      message('m1','Alamat email tidak valid.',false); return;
    }
    setBusy($('b1'),true,'Mengirim...','Kirim magic link');
    try {
      const data = await request('/api/send-link', {
        method:'POST',
        body:JSON.stringify({email})
      });
      if ($('w-em')) $('w-em').textContent = data.email || email;
      message('m1',data.message || 'Magic link berhasil dikirim.',true);
      setTimeout(() => { clearMessage('m1'); setStep(2); $('lk')?.focus(); },500);
    } catch (e) {
      message('m1',e.message || 'Gagal mengirim magic link.',false);
    } finally {
      setBusy($('b1'),false,'Mengirim...','Kirim magic link');
    }
  });

  $('b2')?.addEventListener('click', () => {
    clearMessage('m2'); setStep(1); $('em')?.focus();
  });

  $('b3')?.addEventListener('click', async () => {
    const magicLink = $('lk')?.value.trim() || '';
    const email = $('w-em')?.textContent.trim() || '';
    clearMessage('m2');
    if (!magicLink) { message('m2','Magic link belum diisi.',false); return; }
    setBusy($('b3'),true,'Memverifikasi...','Verifikasi akun');
    try {
      const data = await request('/api/verify-link', {
        method:'POST',
        body:JSON.stringify({email,magicLink})
      });
      const result = data.data || {};
      if ($('r-em')) $('r-em').textContent = result.email || '-';
      if ($('r-uid')) $('r-uid').textContent = result.uid || '-';
      if ($('r-ord')) $('r-ord').textContent = result.orderId || '-';
      if ($('r-status')) $('r-status').textContent = result.membershipStatus || result.status || '-';
      if ($('r-valid')) $('r-valid').textContent = result.validUntil || '-';
      if ($('result-title')) $('result-title').textContent = result.status === 'ACTIVE' ? 'Premium aktif' : 'Verifikasi selesai';
      if ($('result-message')) $('result-message').textContent = data.message || 'Proses selesai.';
      refreshStats(result.stats);
      setStep(3);
    } catch (e) {
      message('m2',e.message || 'Verifikasi gagal.',false);
    } finally {
      setBusy($('b3'),false,'Memverifikasi...','Verifikasi akun');
    }
  });

  $('b5')?.addEventListener('click', () => {
    if ($('em')) $('em').value = '';
    if ($('lk')) $('lk').value = '';
    if ($('w-em')) $('w-em').textContent = '-';
    clearMessage('m1'); clearMessage('m2'); setStep(1); $('em')?.focus();
  });

  setStep(1);
  loadServer();
  loadStats();
})();
