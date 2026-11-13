const $ = (id) => document.getElementById(id);
const VIEWS = ['view-login', 'view-otp', 'view-dashboard'];
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
const initData = tg?.initData || '';
let challengeId = null;

function show(view) {
  VIEWS.forEach((v) => { $(v).hidden = v !== view; });
}

function setErr(id, msg) {
  $(id).textContent = msg || '';
}

async function call(method, path, body) {
  const hasBody = body !== undefined;
  const r = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: hasBody ? { 'Content-Type': 'application/json' } : {},
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Xato: HTTP ${r.status}`);
  return data;
}

function renderMessage(m) {
  const box = document.createElement('article');
  box.className = 'msg';

  const meta = document.createElement('div');
  meta.className = 'meta';
  const when = new Date(m.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
  meta.textContent = `${when} · ${m.contact || '—'}`;

  const topic = document.createElement('div');
  topic.className = 'meta';
  topic.textContent = m.topic || '';

  const body = document.createElement('p');
  body.className = 'body';
  body.textContent = m.message || '';

  box.append(meta, topic, body);
  return box;
}

async function loadDashboard() {
  const [me, stats, list] = await Promise.all([
    call('GET', '/api/admin/me'),
    call('GET', '/api/admin/stats'),
    call('GET', '/api/admin/messages'),
  ]);
  $('who').textContent = me.email;
  $('total').textContent = stats.total;
  $('today').textContent = stats.today;

  const box = $('messages');
  if (list.messages.length) {
    box.replaceChildren(...list.messages.map(renderMessage));
  } else {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Murojaat yo‘q';
    box.replaceChildren(p);
  }
  show('view-dashboard');
}

async function init() {
  if (initData) {
    try {
      const r = await call('POST', '/api/auth/telegram', { init_data: initData });
      challengeId = r.challenge_id;
      show('view-otp');
    } catch (err) {
      show('view-login');
      setErr('msg-login', err.message);
    }
    return;
  }
  try {
    await loadDashboard();
  } catch {
    show('view-login');
  }
}

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  setErr('msg-login');
  try {
    const r = await call('POST', '/api/auth/login', {
      login: $('login').value.trim().toLowerCase(),
      password: $('password').value,
    });
    $('password').value = '';
    if (r.step === 'otp') {
      challengeId = r.challenge_id;
      $('otp-hint').textContent = 'Emailingizga yuborilgan 8 xonali kodni kiriting.';
      show('view-otp');
    } else {
      await loadDashboard();
    }
  } catch (err) {
    setErr('msg-login', err.message);
  }
});

$('form-otp').addEventListener('submit', async (e) => {
  e.preventDefault();
  setErr('msg-otp');
  try {
    await call('POST', '/api/auth/verify', { challenge_id: challengeId, code: $('code').value.trim() });
    $('code').value = '';
    await loadDashboard();
  } catch (err) {
    setErr('msg-otp', err.message);
  }
});

$('logout').addEventListener('click', async () => {
  try {
    await call('POST', '/api/auth/logout', {});
  } finally {
    location.reload();
  }
});

init();
