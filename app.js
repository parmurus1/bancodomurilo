'use strict';
(() => {
  // ================= Configuração =================
  const CFG = window.BANCO_CONFIG || {};
  const CLOUD_CONFIGURED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const GUEST_KEY = 'bancodomurilo:v1';
  const GUEST_FLAG = 'bancodomurilo:guest';
  const LAST_USER_KEY = 'bancodomurilo:lastUser';
  const THEME_KEY = 'bancodomurilo:theme';
  const userKeys = (id) => ({ data: `bancodomurilo:u:${id}`, base: `bancodomurilo:u:${id}:base`, meta: `bancodomurilo:u:${id}:meta` });

  // ================= Utilidades =================
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const buzz = () => { try { navigator.vibrate?.(10); } catch (e) { /* sem vibração */ } };
  // Compara objetos ignorando a ordem das chaves (o Postgres reordena o JSON salvo)
  const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, key) => ((o[key] = x[key]), o), {}) : x));
  const ls = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } },
  };

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => ymd(new Date());
  const curMonth = () => todayStr().slice(0, 7);
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
  const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const daysInMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const dateInMonth = (ym, day) => `${ym}-${pad(Math.min(day, daysInMonth(ym)))}`;
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const monthName = (ym) => MONTHS[Number(ym.slice(5, 7)) - 1];
  const monthLabel = (ym) => `${monthName(ym)} ${ym.slice(0, 4)}`;
  const monthShort = (ym) => monthName(ym).slice(0, 3).toLowerCase();
  const shortDate = (s) => s.split('-').reverse().join('/');
  const shiftDay = (s, n) => { const d = parseDate(s); return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); };
  const ddmm = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const WEEK_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function dateLabel(s) {
    const diff = diffDays(todayStr(), s);
    if (diff === 0) return 'Hoje';
    if (diff === -1) return 'Ontem';
    if (diff === 1) return 'Amanhã';
    const d = parseDate(s);
    const base = `${WEEK[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
    return d.getFullYear() !== new Date().getFullYear() ? `${base} de ${d.getFullYear()}` : base;
  }

  // Dinheiro é sempre guardado em centavos (inteiros) para não ter erro de arredondamento
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function fmt(cents, { sign = false, force = false } = {}) {
    if (S.settings.hideValues && !force) return 'R$ ••••';
    const v = BRL.format(Math.abs(cents) / 100);
    if (cents < 0) return '−' + v;
    if (sign && cents > 0) return '+' + v;
    return v;
  }
  function fmtShort(cents) {
    if (S.settings.hideValues) return 'R$ ••••';
    const v = Math.abs(cents) / 100;
    const s = cents < 0 ? '−' : '';
    if (v >= 1e6) return `${s}R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
    if (v >= 1e4) return `${s}R$ ${(v / 1e3).toFixed(1).replace('.', ',')} mil`;
    return s + BRL.format(Math.round(v)).replace(/,00$/, '');
  }
  function parseMoney(str) {
    let s = String(str || '').replace(/[^\d,.-]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
  const toInput = (c) => (c ? (c / 100).toFixed(2).replace('.', ',') : '');
  // Aceita contas simples no campo de valor: "12+8,50", "3x25", "100/4"
  function evalMoney(str) {
    const s = String(str || '').replace(/\s|R\$/g, '').replace(/[×x]/gi, '*').replace(/÷/g, '/');
    if (!/[+*/]|.-/.test(s)) return parseMoney(s);
    const tokens = s.match(/\d[\d.,]*|[+\-*/]/g);
    if (!tokens) return 0;
    const vals = [], ops = [];
    let sign = 1, expectNum = true;
    for (const tk of tokens) {
      if (/^[+\-*/]$/.test(tk)) {
        if (expectNum) { if (tk === '-') sign = -sign; continue; }
        ops.push(tk); expectNum = true;
      } else { vals.push((sign * parseMoney(tk)) / 100); sign = 1; expectNum = false; }
    }
    if (!vals.length) return 0;
    ops.length = vals.length - 1;
    const v2 = [vals[0]], o2 = [];
    ops.forEach((op, i) => {
      const b = vals[i + 1];
      if (op === '*') v2[v2.length - 1] *= b;
      else if (op === '/') v2[v2.length - 1] = b ? v2[v2.length - 1] / b : 0;
      else { o2.push(op); v2.push(b); }
    });
    return Math.round(o2.reduce((r, op, i) => (op === '+' ? r + v2[i + 1] : r - v2[i + 1]), v2[0]) * 100);
  }
  // Valor curtinho para caber no calendário: 45, 1,2k
  function compact(cents) {
    if (S.settings.hideValues) return '•••';
    const r = Math.abs(cents) / 100;
    return r >= 1000 ? `${(r / 1000).toFixed(1).replace('.', ',')}k` : String(Math.round(r));
  }
  function timeAgo(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'agora mesmo';
    if (s < 3600) return `há ${Math.floor(s / 60)} min`;
    if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
    return `em ${shortDate(ymd(new Date(ms)))}`;
  }

  // ================= Ícones =================
  const svg = (p, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICON = {
    home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    list: svg('<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
    jar: svg('<path d="M8 3h8M7.5 6h9"/><path d="M7.5 6C5.6 7.4 4.5 9.4 4.5 12v6a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-6c0-2.6-1.1-4.6-3-6"/><path d="M4.5 13.5c2.5 1.3 5 1.3 7.5 0s5-1.3 7.5 0"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    gear: svg('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 2.4),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    chevL: svg('<path d="M15 18l-6-6 6-6"/>', 2.4),
    chevR: svg('<path d="M9 18l6-6-6-6"/>', 2.4),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 2.2),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    down: svg('<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>'),
    up: svg('<path d="M12 15V3m0 0L8 7m4-4 4 4M4 21h16"/>'),
    swap: svg('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    file: svg('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    chart: svg('<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-6"/>'),
    card: svg('<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>'),
    people: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>'),
    dots: svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    cloud: svg('<path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 10a4.25 4.25 0 0 1-.5 8.5z"/>'),
    calendar: svg('<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  };

  // ================= Dados =================
  const PALETTE = ['#0f9d6e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16', '#06b6d4', '#a855f7'];
  const CAT_EMOJIS = ['🍔', '🛒', '🚗', '🏠', '💡', '💊', '🎮', '🛍️', '📚', '📺', '📦', '☕', '🍺', '✈️', '🐶', '👕', '💇', '🏋️', '⛽', '🚌', '🎬', '📱', '👶', '🎵', '🔧', '💰', '💻', '📈', '🎁', '✨'];
  const POT_EMOJIS = ['🛟', '✈️', '🏖️', '🏠', '🚗', '📱', '💻', '🎓', '💍', '🎁', '🎮', '🐶', '👶', '🏥', '🎸', '📷', '🛋️', '🚲', '🎉', '💸', '📈', '🧳', '⚽', '🫙'];
  const ACC_EMOJIS = ['🏦', '💳', '💵', '🐷', '📱', '🪙', '💼', '🏧'];
  const POT_TEMPLATES = [
    { name: 'Reserva de emergência', icon: '🛟', color: '#0f9d6e', reserve: true },
    { name: 'Viagem', icon: '✈️', color: '#3b82f6' },
    { name: 'Celular novo', icon: '📱', color: '#8b5cf6' },
    { name: 'Estudos', icon: '🎓', color: '#f59e0b' },
    { name: 'Presentes', icon: '🎁', color: '#ec4899' },
    { name: 'Carro', icon: '🚗', color: '#ef4444' },
  ];
  const DEFAULT_CATS = [
    ['alimentacao', 'Alimentação', '🍔', '#f59e0b', 'expense', false],
    ['mercado', 'Mercado', '🛒', '#84cc16', 'expense', true],
    ['transporte', 'Transporte', '🚗', '#3b82f6', 'expense', true],
    ['moradia', 'Moradia', '🏠', '#8b5cf6', 'expense', true],
    ['contas', 'Contas da casa', '💡', '#06b6d4', 'expense', true],
    ['saude', 'Saúde', '💊', '#ef4444', 'expense', true],
    ['lazer', 'Lazer', '🎮', '#ec4899', 'expense', false],
    ['compras', 'Compras', '🛍️', '#f97316', 'expense', false],
    ['educacao', 'Educação', '📚', '#14b8a6', 'expense', true],
    ['assinaturas', 'Assinaturas', '📺', '#a855f7', 'expense', false],
    ['outros_d', 'Outros', '📦', '#64748b', 'expense', false],
    ['salario', 'Salário', '💰', '#0f9d6e', 'income', false],
    ['freela', 'Freela / Extra', '💻', '#3b82f6', 'income', false],
    ['rendimentos', 'Rendimentos', '📈', '#14b8a6', 'income', false],
    ['presente', 'Presente', '🎁', '#ec4899', 'income', false],
    ['outros_r', 'Outros', '✨', '#64748b', 'income', false],
  ].map(([id, name, icon, color, type, need]) => ({ id, name, icon, color, type, need, budget: 0 }));

  function freshState() {
    return {
      version: 1,
      accounts: [{ id: 'principal', name: 'Conta principal', icon: '🏦', color: '#0f9d6e', initial: 0 }],
      categories: DEFAULT_CATS.map((c) => ({ ...c })),
      transactions: [], // {id, type: expense|income|transfer, amount, desc, categoryId, accountId, toAccountId, date, note, group?, createdAt}
      pots: [],         // {id, name, icon, color, goal, deadline, percent, createdAt}
      potMoves: [],     // {id, potId, accountId, amount (+ guardou / − resgatou), date, note, createdAt}
      bills: [],        // {id, type: expense|income, name, amount, day, categoryId, accountId, auto, paid: {'AAAA-MM': txId}}
      debts: [],        // {id, person, type: owed (me devem) | owe (eu devo), amount, desc, date, due, payments: [{id, amount, date, txId}]}
      settings: { name: '', theme: 'auto', hideValues: false, onboarded: false },
    };
  }
  const COLLECTIONS = ['accounts', 'categories', 'transactions', 'pots', 'potMoves', 'bills', 'debts'];
  function migrate(d) {
    const base = freshState();
    const out = { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}) } };
    COLLECTIONS.forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    if (!out.accounts.length) out.accounts = base.accounts;
    out.accounts = out.accounts.map((a) => ({ kind: 'checking', ...a }));
    out.bills = out.bills.map((b) => ({ type: 'expense', auto: false, ...b, paid: b.paid || {} }));
    delete out.exportedAt;
    return out;
  }

  let S = freshState();
  const UI = { month: curMonth(), year: new Date().getFullYear(), mode: 'list', debtTab: 'open', filters: { q: '', type: 'all', cat: '', acc: '', day: '', all: false } };
  let started = false;

  // ================= Armazenamento local + nuvem =================
  // Os dados ficam sempre no aparelho (o app funciona offline). Com login, uma cópia vai para o
  // Supabase (tabela user_data, um documento por usuário) e é mesclada entre os aparelhos.
  let sb = null, user = null, channel = null, entering = null;
  const sync = { version: 0, dirty: false, base: null, status: 'local', pushing: false, again: false, timer: null, lastSync: 0 };
  const dataKey = () => (user ? userKeys(user.id).data : GUEST_KEY);
  let storageOk = true;
  function saveLocal() {
    const ok = ls.set(dataKey(), S);
    if (!ok && storageOk) toast('Não consegui salvar neste navegador. Faça um backup!');
    storageOk = ok;
  }
  function save() {
    saveLocal();
    if (user) { sync.dirty = true; persistMeta(); schedulePush(); }
  }
  const snapshot = () => JSON.stringify(S);
  const restore = (snap) => { S = JSON.parse(snap); save(); render(); };
  const refresh = () => { if (started) render(); };

  function persistMeta() { if (user) ls.set(userKeys(user.id).meta, { version: sync.version, dirty: sync.dirty, lastSync: sync.lastSync }); }
  // A base precisa ser uma cópia independente: se dividir listas com S, tudo que for
  // adicionado aqui pareceria já sincronizado e seria descartado na mescla.
  function setBase(data) { sync.base = JSON.parse(JSON.stringify(data)); if (user) ls.set(userKeys(user.id).base, data); }
  // Tema e "ocultar valores" são de cada aparelho; o resto sincroniza
  const LOCAL_SETTINGS = ['theme', 'hideValues'];
  function cloudPayload() { const st = { ...S.settings }; LOCAL_SETTINGS.forEach((k) => delete st[k]); return { ...S, settings: st }; }
  function adoptRemote(data) {
    const keep = {};
    LOCAL_SETTINGS.forEach((k) => (keep[k] = S.settings[k]));
    const out = migrate(data);
    Object.assign(out.settings, keep);
    return out;
  }

  // Mescla em 3 vias (base = última versão sincronizada): o que mudou aqui ganha,
  // o que mudou no outro aparelho entra, e o que foi apagado em um dos lados some.
  function merge3(base, local, remote) {
    base = base || {};
    const out = { ...remote };
    for (const key of COLLECTIONS) {
      const B = new Map((base[key] || []).map((x) => [x.id, stable(x)]));
      const L = new Map((local[key] || []).map((x) => [x.id, x]));
      const seen = new Set(), res = [];
      for (const r of remote[key] || []) {
        seen.add(r.id);
        const l = L.get(r.id);
        if (!l) { if (!B.has(r.id)) res.push(r); continue; }
        res.push(B.get(r.id) !== stable(l) ? l : r);
      }
      for (const l of local[key] || []) if (!seen.has(l.id) && !B.has(l.id)) res.push(l);
      out[key] = res;
    }
    out.settings = stable(base.settings || {}) !== stable(local.settings || {}) ? local.settings : remote.settings;
    return out;
  }

  async function pull() {
    const { data, error } = await sb.from('user_data').select('data, version').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  }
  function schedulePush(ms = 1200) {
    if (!sb) return setStatus('offline');
    clearTimeout(sync.timer);
    setStatus(navigator.onLine ? 'pending' : 'offline');
    sync.timer = setTimeout(push, ms);
  }
  async function push() {
    if (!sb || !user) return;
    if (!navigator.onLine) return setStatus('offline');
    if (sync.pushing) { sync.again = true; return; }
    if (!sync.dirty) return setStatus('ok');
    sync.pushing = true;
    setStatus('saving');
    try {
      const payload = cloudPayload();
      if (!sync.version) {
        const { error } = await sb.from('user_data').insert({ user_id: user.id, data: payload, version: 1 });
        if (error && error.code !== '23505') throw error;
        if (error) await reconcile(); // outro aparelho criou primeiro
        else { sync.version = 1; setBase(payload); sync.dirty = false; }
      } else {
        const { data, error } = await sb.from('user_data')
          .update({ data: payload, version: sync.version + 1, updated_at: new Date().toISOString() })
          .eq('user_id', user.id).eq('version', sync.version).select('version');
        if (error) throw error;
        if (!data || !data.length) await reconcile(); // alguém salvou antes: mescla e tenta de novo
        else { sync.version = data[0].version; setBase(payload); sync.dirty = false; }
      }
      if (!sync.dirty) sync.lastSync = Date.now();
      persistMeta();
      setStatus(sync.dirty ? 'pending' : 'ok');
    } catch (e) {
      console.warn('sync', e);
      setStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      sync.pushing = false;
      const retry = sync.again || (sync.dirty && sync.status === 'pending');
      sync.again = false;
      if (retry) schedulePush(400);
    }
  }
  async function reconcile() {
    const row = await pull();
    if (!row) { sync.version = 0; return; }
    S = adoptRemote(merge3(sync.base, cloudPayload(), row.data));
    sync.version = row.version;
    setBase(row.data);
    sync.dirty = stable(cloudPayload()) !== stable(row.data);
    saveLocal(); persistMeta(); refresh();
  }
  function applyRemote(row) {
    S = adoptRemote(row.data);
    sync.version = row.version; sync.dirty = false; sync.lastSync = Date.now();
    setBase(row.data); saveLocal(); persistMeta(); setStatus('ok'); refresh();
  }
  async function checkRemote() {
    if (!sb || !user || !navigator.onLine || sync.pushing) return;
    try {
      const row = await pull();
      if (!row) { if (sync.dirty) push(); return; }
      if (row.version === sync.version) { if (sync.dirty) push(); else setStatus('ok'); return; }
      if (!sync.dirty) applyRemote(row);
      else { await reconcile(); push(); }
    } catch (e) { setStatus(navigator.onLine ? 'error' : 'offline'); }
  }
  function subscribe() {
    try { channel?.unsubscribe(); } catch (e) { /* ignora */ }
    channel = sb.channel('user_data_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_data', filter: `user_id=eq.${user.id}` }, (p) => {
        if (p.new && p.new.version && p.new.version !== sync.version) checkRemote();
      })
      .subscribe();
  }

  const SYNC_LABEL = { ok: 'Sincronizado', saving: 'Salvando…', pending: 'Salvando…', offline: 'Offline', error: 'Falha ao sincronizar', guest: 'Entrar', local: '' };
  function syncPill(full) {
    if (sync.status === 'local') return '';
    const label = SYNC_LABEL[sync.status];
    return `<button class="sync-pill s-${sync.status}" data-action="sync-now" title="${label}" aria-label="${label}">${ICON.cloud}<span class="${full ? '' : 'sync-txt'}">${label}</span></button>`;
  }
  function setStatus(s) { sync.status = s; paintSync(); }
  function paintSync() { $$('[data-sync-slot]').forEach((el) => (el.innerHTML = syncPill(el.dataset.syncSlot === 'full'))); }

  // ================= Cálculos =================
  const NOCAT = { id: null, name: 'Sem categoria', icon: '❔', color: '#94a3b8' };
  const getCat = (id) => S.categories.find((c) => c.id === id) || NOCAT;
  const getAcc = (id) => S.accounts.find((a) => a.id === id) || { id, name: 'Conta removida', icon: '🏦', color: '#94a3b8', initial: 0 };
  const getPot = (id) => S.pots.find((p) => p.id === id);
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0));

  function accBalance(id) {
    const t = todayStr();
    let b = getAcc(id).initial || 0;
    for (const tx of S.transactions) {
      if (tx.date > t) continue; // lançamentos futuros (parcelas) ainda não saíram da conta
      if (tx.type === 'income' && tx.accountId === id) b += tx.amount;
      else if (tx.type === 'expense' && tx.accountId === id) b -= tx.amount;
      else if (tx.type === 'transfer') {
        if (tx.accountId === id) b -= tx.amount;
        if (tx.toAccountId === id) b += tx.amount;
      }
    }
    for (const m of S.potMoves) if (m.accountId === id) b -= m.amount;
    return b;
  }
  const isCard = (a) => !!a && a.kind === 'credit';
  const cashAccounts = () => S.accounts.filter((a) => !isCard(a));
  const cashOrAll = () => (cashAccounts().length ? cashAccounts() : S.accounts);
  const cards = () => S.accounts.filter(isCard);
  const totalAvailable = () => cashAccounts().reduce((s, a) => s + accBalance(a.id), 0);
  const cardDebt = () => cards().reduce((s, c) => s + Math.max(0, -accBalance(c.id)), 0);
  const potBalance = (id) => S.potMoves.reduce((s, m) => (m.potId === id ? s + m.amount : s), 0);
  const totalPots = () => S.pots.reduce((s, p) => s + potBalance(p.id), 0);

  function monthStats(ym) {
    let inc = 0, exp = 0;
    const byCat = {};
    for (const tx of S.transactions) {
      if (!tx.date.startsWith(ym)) continue;
      if (tx.type === 'income') inc += tx.amount;
      else if (tx.type === 'expense') { exp += tx.amount; byCat[tx.categoryId] = (byCat[tx.categoryId] || 0) + tx.amount; }
    }
    return { inc, exp, net: inc - exp, byCat };
  }
  function avgMonthlyExp(n = 3) {
    let sum = 0, cnt = 0;
    for (let i = 1; i <= n; i++) { const s = monthStats(addMonths(curMonth(), -i)); if (s.exp) { sum += s.exp; cnt++; } }
    return cnt ? Math.round(sum / cnt) : 0;
  }
  function avgByCat(n = 3) {
    const out = {};
    for (let i = 1; i <= n; i++) {
      const s = monthStats(addMonths(curMonth(), -i));
      for (const [k, v] of Object.entries(s.byCat)) out[k] = (out[k] || 0) + v / n;
    }
    return out;
  }
  function potInfo(p) {
    const bal = potBalance(p.id);
    const pct = p.goal ? Math.min(100, Math.max(0, (bal / p.goal) * 100)) : 0;
    const done = !!p.goal && bal >= p.goal;
    let hint;
    if (done) hint = 'Meta atingida! 🎉';
    else if (p.goal && p.deadline) {
      const days = diffDays(todayStr(), p.deadline);
      if (days < 0) hint = `Prazo passou · faltam ${fmt(p.goal - bal)}`;
      else {
        const months = Math.max(1, Math.ceil(days / 30.44));
        hint = `Guarde ${fmt(Math.ceil((p.goal - bal) / months))}/mês`;
      }
    } else if (p.goal) hint = `Faltam ${fmt(p.goal - bal)}`;
    else hint = 'Sem meta — guarde quanto quiser';
    return { bal, pct, done, hint };
  }
  function deadlineText(p) {
    if (!p.deadline) return p.goal ? 'Sem prazo' : 'Livre';
    const days = diffDays(todayStr(), p.deadline);
    if (days < 0) return `Prazo: ${shortDate(p.deadline)}`;
    if (days < 45) return `Faltam ${days} dia${days === 1 ? '' : 's'}`;
    const m = Math.round(days / 30.44);
    return `Faltam ${m} meses · ${monthShort(p.deadline.slice(0, 7))}/${p.deadline.slice(2, 4)}`;
  }
  function isBillPaid(b, ym) {
    const id = b.paid && b.paid[ym];
    return !!id && S.transactions.some((t) => t.id === id);
  }
  function billStatus(b, ym) {
    const inc = b.type === 'income';
    if (isBillPaid(b, ym)) return { key: 'paid', label: inc ? 'Recebido' : 'Pago' };
    const d = diffDays(todayStr(), dateInMonth(ym, b.day));
    if (d < 0) return { key: 'late', label: `${inc ? 'Atrasado' : 'Atrasada'} ${-d}d` };
    if (d === 0) return { key: 'today', label: inc ? 'Cai hoje' : 'Vence hoje' };
    if (d <= 3) return { key: 'soon', label: inc ? (d === 1 ? 'Cai amanhã' : `Cai em ${d} dias`) : d === 1 ? 'Vence amanhã' : `Vence em ${d} dias` };
    return { key: 'open', label: inc ? 'A receber' : 'A pagar' };
  }
  // Fixos marcados como automáticos viram lançamento sozinhos no dia. O id é fixo por mês,
  // então dois aparelhos fazendo isso ao mesmo tempo não duplicam nada.
  function runAutoRecurring() {
    const ym = curMonth(), t = todayStr(), done = [];
    for (const b of S.bills) {
      if (!b.auto || (b.paid && b.paid[ym])) continue;
      const due = dateInMonth(ym, b.day);
      if (due > t) continue;
      const id = `auto-${b.id}-${ym}`;
      if (!S.transactions.some((x) => x.id === id)) {
        S.transactions.push({ id, type: b.type === 'income' ? 'income' : 'expense', amount: b.amount, desc: b.name, categoryId: b.categoryId, accountId: S.accounts.some((a) => a.id === b.accountId) ? b.accountId : S.accounts[0].id, toAccountId: null, date: due, note: 'Lançado automaticamente', createdAt: Date.now() });
      }
      b.paid = b.paid || {};
      b.paid[ym] = id;
      done.push(b.name);
    }
    if (done.length) { save(); refresh(); toast(`Lançado automaticamente: ${done.join(', ')}`); }
  }

  // ---- Cartão de crédito: cada compra cai na fatura do ciclo (fechamento → fechamento)
  function cycleFor(card, date) {
    const ym = date.slice(0, 7);
    const endYm = date <= dateInMonth(ym, card.closeDay) ? ym : addMonths(ym, 1);
    const end = dateInMonth(endYm, card.closeDay);
    const start = shiftDay(dateInMonth(addMonths(endYm, -1), card.closeDay), 1);
    const due = dateInMonth(card.dueDay > card.closeDay ? endYm : addMonths(endYm, 1), card.dueDay);
    return { start, end, due };
  }
  function invoiceTotal(card, cyc) {
    let t = 0;
    for (const tx of S.transactions) {
      if (tx.accountId !== card.id || tx.date < cyc.start || tx.date > cyc.end) continue;
      if (tx.type === 'expense') t += tx.amount; else if (tx.type === 'income') t -= tx.amount; // receita no cartão = estorno
    }
    return t;
  }
  const invoiceTx = (card, cyc) => S.transactions.filter((x) => x.accountId === card.id && x.type !== 'transfer' && x.date >= cyc.start && x.date <= cyc.end).sort(byDateDesc);
  function cardInfo(card) {
    const t = todayStr();
    const open = cycleFor(card, t);
    const closed = cycleFor(card, shiftDay(open.start, -1));
    open.total = invoiceTotal(card, open);
    closed.total = invoiceTotal(card, closed);
    const paidAfterClose = S.transactions.filter((x) => x.type === 'transfer' && x.toAccountId === card.id && x.date > closed.end).reduce((s, x) => s + x.amount, 0);
    closed.remaining = Math.max(0, closed.total - paidAfterClose);
    open.remaining = Math.max(0, open.total - Math.max(0, paidAfterClose - closed.total));
    const future = S.transactions.filter((x) => x.accountId === card.id && x.type === 'expense' && x.date > t).reduce((s, x) => s + x.amount, 0);
    const debt = Math.max(0, -accBalance(card.id));
    const used = debt + future;
    return { open, closed, debt, future, used, available: (card.limit || 0) - used };
  }
  function invoiceStatus(inv) {
    if (inv.total <= 0) return { key: 'none', label: '' };
    if (inv.remaining <= 0) return { key: 'paid', label: 'Paga' };
    const d = diffDays(todayStr(), inv.due);
    if (d < 0) return { key: 'late', label: 'Atrasada' };
    if (d <= 5) return { key: 'soon', label: d === 0 ? 'Vence hoje' : `Vence em ${d}d` };
    return { key: 'open', label: `Vence ${ddmm(inv.due)}` };
  }

  // ---- Previsão: saldo de hoje + o que ainda vai entrar/sair até o fim do mês
  function forecast() {
    const ym = curMonth(), t = todayStr(), end = dateInMonth(ym, 31);
    const cash = new Set(cashAccounts().map((a) => a.id));
    const items = [];
    for (const b of S.bills) {
      if (isBillPaid(b, ym)) continue;
      if (b.type !== 'income' && isCard(getAcc(b.accountId))) continue; // vai para a fatura
      items.push({ label: b.name, icon: getCat(b.categoryId).icon, date: dateInMonth(ym, b.day), amount: b.type === 'income' ? b.amount : -b.amount, tag: 'fixo' });
    }
    for (const tx of S.transactions) {
      if (tx.date <= t || tx.date > end) continue;
      const item = { label: tx.desc, icon: tx.type === 'transfer' ? '⇄' : getCat(tx.categoryId).icon, date: tx.date, tag: 'agendado' };
      if (tx.type === 'income' && cash.has(tx.accountId)) items.push({ ...item, amount: tx.amount });
      else if (tx.type === 'expense' && cash.has(tx.accountId)) items.push({ ...item, amount: -tx.amount });
      else if (tx.type === 'transfer' && cash.has(tx.accountId) && !cash.has(tx.toAccountId)) items.push({ ...item, amount: -tx.amount });
    }
    for (const c of cards()) {
      const inf = cardInfo(c);
      [inf.closed, inf.open].forEach((inv) => {
        if (inv.remaining > 0 && inv.due <= end) items.push({ label: `Fatura ${c.name}`, icon: c.icon, date: inv.due, amount: -inv.remaining, tag: 'fatura' });
      });
    }
    items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const now = totalAvailable();
    return { now, items, end: now + items.reduce((s, i) => s + i.amount, 0), endDate: end };
  }

  // Patrimônio numa data: saldos iniciais + tudo que entrou − tudo que saiu + rendimentos dos potes
  function netWorthAt(date) {
    let v = S.accounts.reduce((s, a) => s + (a.initial || 0), 0);
    for (const tx of S.transactions) {
      if (tx.date > date) continue;
      if (tx.type === 'income') v += tx.amount; else if (tx.type === 'expense') v -= tx.amount;
    }
    for (const m of S.potMoves) if (!m.accountId && m.date <= date) v += m.amount;
    return v;
  }

  const debtPaid = (d) => (d.payments || []).reduce((s, p) => s + p.amount, 0);
  const debtRemaining = (d) => Math.max(0, d.amount - debtPaid(d));
  const personColor = (name) => PALETTE[[...norm(name)].reduce((s, ch) => s + ch.charCodeAt(0), 0) % PALETTE.length];

  // ---- Categoria automática: primeiro pelo seu histórico, depois por palavras-chave
  const KEYWORDS = {
    alimentacao: ['ifood', 'i food', 'restaurante', 'lanchonete', 'padaria', 'burger', 'pizza', 'pizzaria', 'mcdonalds', 'mc donalds', 'bk', 'rappi', 'cafe', 'cafeteria', 'starbucks', 'outback', 'subway', 'sushi', 'acai', 'almoco', 'jantar', 'lanche', 'sorvete', 'doceria', 'hamburgueria', 'churrascaria'],
    mercado: ['mercado', 'supermercado', 'supermerc', 'carrefour', 'atacadao', 'assai', 'pao de acucar', 'hortifruti', 'sacolao', 'atacarejo', 'mercadinho', 'zona sul', 'prezunic', 'guanabara', 'sams club', 'makro'],
    transporte: ['uber', '99', '99app', '99 pop', 'posto', 'combustivel', 'gasolina', 'shell', 'ipiranga', 'petrobras', 'estacionamento', 'metro', 'onibus', 'bilhete unico', 'sem parar', 'cabify', 'pedagio', 'veloe', 'conectcar', 'zul digital'],
    assinaturas: ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'youtube premium', 'apple.com', 'icloud', 'deezer', 'globoplay', 'paramount', 'crunchyroll', 'chatgpt', 'openai', 'google one', 'game pass', 'playstation plus', 'claude.ai', 'anthropic'],
    saude: ['farmacia', 'drogaria', 'droga raia', 'drogasil', 'pacheco', 'pague menos', 'hospital', 'clinica', 'laboratorio', 'unimed', 'dentista', 'consulta', 'smart fit', 'smartfit', 'academia', 'bluefit'],
    moradia: ['aluguel', 'condominio', 'iptu', 'quintoandar', 'quinto andar'],
    contas: ['energia', 'enel', 'cemig', 'light', 'copel', 'celesc', 'coelba', 'sabesp', 'copasa', 'cedae', 'conta de agua', 'claro', 'vivo', 'tim', 'internet', 'comgas', 'conta de luz'],
    lazer: ['cinema', 'cinemark', 'ingresso', 'sympla', 'steam', 'nintendo', 'show', 'teatro', 'boliche', 'balada', 'barzinho'],
    compras: ['amazon', 'mercado livre', 'mercadolivre', 'shopee', 'magalu', 'magazine luiza', 'americanas', 'aliexpress', 'shein', 'renner', 'riachuelo', 'zara', 'casas bahia', 'kabum', 'centauro', 'netshoes', 'decathlon', 'temu'],
    educacao: ['curso', 'udemy', 'alura', 'escola', 'faculdade', 'universidade', 'livraria', 'mensalidade escolar'],
    salario: ['salario', 'folha de pagamento', 'proventos', 'pagamento de salario'],
    rendimentos: ['rendimento', 'rendimentos', 'juros', 'dividendo', 'dividendos'],
    freela: ['freela', 'freelance'],
  };
  const reEsc = (s) => s.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
  const KW_RE = Object.entries(KEYWORDS).map(([id, words]) => [id, words.map((w) => new RegExp('(^|[^a-z0-9])' + reEsc(w) + '($|[^a-z0-9])'))]);
  const cleanDesc = (s) => norm(s).replace(/ \(\d+\/\d+\)$/, '');
  function historyMap() {
    const m = new Map();
    [...S.transactions].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach((t) => {
      if (t.type !== 'transfer' && t.categoryId) m.set(t.type + '|' + cleanDesc(t.desc), t.categoryId);
    });
    return m;
  }
  function guessCategory(desc, type, hist = historyMap()) {
    const n = cleanDesc(desc);
    if (!n) return null;
    const h = hist.get(type + '|' + n);
    if (h && S.categories.some((c) => c.id === h)) return h;
    for (const [id, res] of KW_RE) {
      const c = S.categories.find((x) => x.id === id);
      if (c && c.type === type && res.some((re) => re.test(n))) return id;
    }
    return null;
  }
  const fallbackCat = (type) => (S.categories.find((c) => c.type === type && /^outros/i.test(c.name)) || S.categories.find((c) => c.type === type) || {}).id || null;
  // Os lançamentos que você mais repete nos últimos meses viram atalhos de um toque
  function frequentTx() {
    const since = shiftDay(todayStr(), -120), map = new Map();
    for (const t of S.transactions) {
      if (t.type === 'transfer' || t.date < since || t.group) continue;
      const k = t.type + '|' + cleanDesc(t.desc);
      const e = map.get(k) || { n: 0, t };
      e.n++;
      if ((t.createdAt || 0) >= (e.t.createdAt || 0)) e.t = t;
      map.set(k, e);
    }
    return [...map.values()].filter((e) => e.n >= 2).sort((a, b) => b.n - a.n).slice(0, 8).map((e) => e.t);
  }

  // ================= Componentes =================
  const accOptions = (sel, list = S.accounts) => list.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.icon} ${esc(a.name)}${isCard(a) ? ' · crédito' : ''}</option>`).join('');
  const monthNav = () => `
    <div class="month-nav">
      <button data-action="month-prev" aria-label="Mês anterior">${ICON.chevL}</button>
      <button class="month-label" data-action="month-today">${monthLabel(UI.month)}${UI.month === curMonth() ? '<em>atual</em>' : ''}</button>
      <button data-action="month-next" aria-label="Próximo mês">${ICON.chevR}</button>
    </div>`;
  const emptyBox = (big, title, text, btn = '') => `<div class="empty"><div class="big">${big}</div><b>${title}</b>${text}${btn}</div>`;

  function txRow(tx) {
    const future = tx.date > todayStr();
    let icon, color, title, sub, amt, cls = '';
    if (tx.type === 'transfer') {
      icon = '⇄'; color = '#64748b'; title = tx.desc || 'Transferência';
      sub = `${getAcc(tx.accountId).name} → ${getAcc(tx.toAccountId).name}`;
      amt = fmt(tx.amount); cls = 'neutral';
    } else {
      const c = getCat(tx.categoryId);
      icon = c.icon; color = c.color; title = tx.desc || c.name;
      sub = `${c.name} · ${getAcc(tx.accountId).name}`;
      if (tx.type === 'income') { amt = fmt(tx.amount, { sign: true }); cls = 'pos'; } else amt = fmt(-tx.amount);
    }
    return `<button class="tx ${future ? 'future' : ''}" data-action="edit-tx" data-id="${tx.id}">
      <span class="tx-ic" style="--c:${color}">${icon}</span>
      <span class="tx-main"><b>${esc(title)}</b><small>${esc(sub)}${future ? '<em class="tag">agendado</em>' : ''}</small></span>
      <span class="tx-amt ${cls}">${amt}</span></button>`;
  }
  function moveRow(m) {
    const p = getPot(m.potId), yld = !m.accountId; // sem conta = rendimento do próprio pote
    return `<button class="tx" data-action="pot-detail" data-id="${m.potId}">
      <span class="tx-ic" style="--c:${p ? p.color : '#64748b'}">${yld ? '📈' : p ? p.icon : '🫙'}</span>
      <span class="tx-main"><b>${yld ? 'Rendimento em' : m.amount > 0 ? 'Guardado em' : 'Resgatado de'} ${esc(p ? p.name : 'pote')}</b><small>${yld ? 'Pote' : `${esc(m.note || 'Pote')} · ${esc(getAcc(m.accountId).name)}`}</small></span>
      <span class="tx-amt ${yld ? 'pos' : 'neutral'}">${fmt(yld ? m.amount : -m.amount, { sign: true })}</span></button>`;
  }

  function catSegments(byCat) {
    const arr = Object.entries(byCat)
      .map(([id, value]) => { const c = getCat(id); return { name: c.name, icon: c.icon, color: c.color, value }; })
      .sort((a, b) => b.value - a.value);
    if (arr.length > 6) {
      const rest = arr.splice(5);
      arr.push({ name: 'Outras', icon: '•', color: '#94a3b8', value: rest.reduce((s, x) => s + x.value, 0) });
    }
    return arr;
  }
  function donutBlock(segs, total) {
    const r = 52, c = 2 * Math.PI * r;
    let off = 0;
    const arcs = segs.map((s) => {
      const len = (s.value / total) * c;
      const gap = segs.length > 1 ? 2 : 0;
      const el = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${s.color}" stroke-width="18" stroke-dasharray="${Math.max(len - gap, 0.01)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(s.name)}: ${fmt(s.value)}</title></circle>`;
      off += len;
      return el;
    }).join('');
    return `<div class="donut-wrap">
      <svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Gastos por categoria"><circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--surface-2)" stroke-width="18"/>${arcs}<text x="70" y="65" class="donut-k">TOTAL</text><text x="70" y="83" class="donut-v">${fmtShort(total)}</text></svg>
      <ul class="legend">${segs.map((s) => `<li><i style="background:${s.color}"></i><span>${s.icon} ${esc(s.name)}</span><b>${fmtShort(s.value)}</b><em>${Math.round((s.value / total) * 100)}%</em></li>`).join('')}</ul>
    </div>`;
  }
  function barsSvg(months, cur, W = 320) {
    const H = 150, top = 8, bottom = 22, ch = H - top - bottom;
    const max = Math.max(1, ...months.flatMap((m) => [m.inc, m.exp]));
    const gw = W / months.length, bw = Math.min(16, gw / 3.2);
    let s = `<svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas e saídas dos últimos 6 meses">`;
    for (let i = 1; i <= 3; i++) { const y = top + ch - (ch * i) / 3; s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 4"/>`; }
    months.forEach((m, i) => {
      const cx = gw * i + gw / 2;
      const hi = (m.inc / max) * ch, he = (m.exp / max) * ch;
      s += `<rect class="hit" data-action="month-set" data-ym="${m.ym}" x="${gw * i + 2}" y="0" width="${gw - 4}" height="${H}" rx="8" fill="transparent"/>`;
      if (m.inc) s += `<rect x="${cx - bw - 2}" y="${top + ch - hi}" width="${bw}" height="${hi}" rx="4" fill="var(--pos)" pointer-events="none"/>`;
      if (m.exp) s += `<rect x="${cx + 2}" y="${top + ch - he}" width="${bw}" height="${he}" rx="4" fill="var(--neg)" opacity=".85" pointer-events="none"/>`;
      s += `<text x="${cx}" y="${H - 6}" class="${m.ym === cur ? 'cur' : ''}" pointer-events="none">${monthShort(m.ym)}</text>`;
    });
    return s + `<line x1="0" x2="${W}" y1="${top + ch}" y2="${top + ch}" stroke="var(--line)"/></svg>`;
  }

  function insightsHtml(ym, st) {
    const list = [];
    const isCur = ym === curMonth();
    const t = todayStr();
    if (!S.transactions.length) list.push({ ic: '👋', tone: 'good', text: 'Comece registrando seu primeiro gasto ou receita no botão <b>+</b>.' });

    if (isCur) for (const c of cards()) {
      const inv = cardInfo(c).closed;
      if (inv.remaining <= 0) continue;
      const d = diffDays(t, inv.due);
      if (d <= 5) list.push({ ic: '💳', tone: d < 0 ? 'danger' : 'warn', text: `Fatura <b>${esc(c.name)}</b> ${d < 0 ? 'está atrasada' : d === 0 ? 'vence hoje' : `vence em ${d} dia${d > 1 ? 's' : ''}`} · ${fmt(inv.remaining)}`, btn: { label: 'Pagar', action: 'card-pay', id: c.id } });
    }
    if (isCur) for (const db of S.debts) {
      const rem = debtRemaining(db);
      if (!db.due || rem <= 0) continue;
      const d = diffDays(t, db.due);
      if (d > 3) continue;
      const when = d < 0 ? ' (passou do combinado)' : d === 0 ? ' (combinado para hoje)' : '';
      list.push({ ic: '🤝', tone: d < 0 ? 'danger' : 'warn', text: db.type === 'owed' ? `<b>${esc(db.person)}</b> te deve ${fmt(rem)}${when}` : `Você deve ${fmt(rem)} para <b>${esc(db.person)}</b>${when}`, btn: { label: 'Ver', action: 'debt-detail', id: db.id } });
    }
    if (isCur) for (const b of S.bills) {
      if (b.type === 'income') continue;
      const s = billStatus(b, ym);
      if (['late', 'today', 'soon'].includes(s.key)) {
        list.push({ ic: '🧾', tone: s.key === 'late' ? 'danger' : 'warn', text: `<b>${esc(b.name)}</b> ${s.key === 'late' ? 'está atrasada' : s.label.toLowerCase()} · ${fmt(b.amount)}`, btn: { label: 'Pagar', action: 'bill-pay', id: b.id } });
      }
    }
    for (const c of S.categories) {
      if (c.type !== 'expense' || !c.budget) continue;
      const spent = st.byCat[c.id] || 0, p = spent / c.budget;
      if (p >= 1) list.push({ ic: c.icon, tone: 'danger', text: `Orçamento de <b>${esc(c.name)}</b> estourado: ${fmt(spent)} de ${fmt(c.budget)}` });
      else if (p >= 0.8) list.push({ ic: c.icon, tone: 'warn', text: `Você já usou <b>${Math.round(p * 100)}%</b> do orçamento de ${esc(c.name)}` });
    }
    if (isCur) {
      const day = new Date().getDate(), dim = daysInMonth(ym);
      const spentSoFar = S.transactions.filter((x) => x.type === 'expense' && x.date.startsWith(ym) && x.date <= t).reduce((s, x) => s + x.amount, 0);
      if (spentSoFar > 0 && day >= 5 && day < dim) {
        list.push({ ic: '🔮', tone: '', text: `No ritmo atual, você deve gastar cerca de <b>${fmt(Math.round((spentSoFar / day) * dim))}</b> este mês.` });
      }
      const prev = addMonths(ym, -1);
      const prevSame = S.transactions.filter((x) => x.type === 'expense' && x.date.startsWith(prev) && Number(x.date.slice(8)) <= day).reduce((s, x) => s + x.amount, 0);
      if (prevSame > 0 && spentSoFar > 0) {
        const diff = (spentSoFar - prevSame) / prevSame;
        if (Math.abs(diff) >= 0.05) list.push({ ic: diff < 0 ? '📉' : '📈', tone: diff < 0 ? 'good' : 'warn', text: `Até hoje você gastou <b>${Math.abs(Math.round(diff * 100))}% ${diff < 0 ? 'menos' : 'mais'}</b> que no mesmo período de ${monthName(prev).toLowerCase()}.` });
      }
    }
    const avail = totalAvailable();
    if (st.net > 0 && st.inc > 0 && S.pots.length && avail > 0) {
      list.push({ ic: '🫙', tone: 'good', text: `Sobrou <b>${fmt(st.net)}</b> em ${monthName(ym).toLowerCase()}. Que tal guardar uma parte?`, btn: { label: 'Guardar', action: 'pot-distribute', amount: Math.min(st.net, avail) } });
    }
    if (!list.length) return '';
    const w = { danger: 0, warn: 1, good: 2, '': 3 };
    list.sort((a, b) => w[a.tone] - w[b.tone]);
    return `<div class="insights">${list.slice(0, 4).map((i) => `
      <div class="insight ${i.tone}"><span class="i-ic">${i.ic}</span><p>${i.text}</p>${i.btn ? `<button class="btn sm soft" data-action="${i.btn.action}" ${i.btn.id ? `data-id="${i.btn.id}"` : ''} ${i.btn.amount ? `data-amount="${i.btn.amount}"` : ''}>${i.btn.label}</button>` : ''}</div>`).join('')}</div>`;
  }

  // ================= Telas =================
  function viewInicio() {
    const ym = UI.month, st = monthStats(ym), avail = totalAvailable(), inPots = totalPots(), debt = cardDebt(), fc = forecast();
    const months = Array.from({ length: 6 }, (_, i) => { const m = addMonths(ym, i - 5); const s = monthStats(m); return { ym: m, inc: s.inc, exp: s.exp }; });
    const t = todayStr();
    const recent = S.transactions.filter((x) => x.date <= t).sort(byDateDesc).slice(0, 6);
    const pots = S.pots.map((p) => `
      <button class="pot-mini" data-action="pot-detail" data-id="${p.id}" style="--c:${p.color}">
        <span class="jar sm" style="--p:${p.goal ? potInfo(p).pct : 100}%">${p.icon}</span>
        <b>${esc(p.name)}</b><strong>${fmt(potBalance(p.id))}</strong>
        ${p.goal ? `<div class="bar"><i style="width:${potInfo(p).pct}%"></i></div>` : ''}
      </button>`).join('');
    return `<div class="page">
      <div class="home-top">
        <section class="hero">
          <div class="hero-row"><span class="hero-label">Saldo disponível</span>
            <button class="hero-eye" data-action="toggle-hide" aria-label="Mostrar ou ocultar valores">${S.settings.hideValues ? ICON.eyeOff : ICON.eye}</button></div>
          <div class="hero-value">${fmt(avail)}</div>
          <div class="hero-split">
            <div><small>🫙 Nos potes</small><b>${fmt(inPots)}</b></div>
            <div><small>💎 Patrimônio</small><b>${fmt(avail + inPots - debt)}</b></div>
          </div>
          ${S.accounts.length > 1 ? `<div class="hero-accs">${cashAccounts().map((a) => `<span>${a.icon} ${esc(a.name)} · ${fmt(accBalance(a.id))}</span>`).join('')}${debt ? `<span>💳 Cartões · ${fmt(-debt)}</span>` : ''}</div>` : ''}
          <button class="hero-fc" data-action="forecast"><span>📅 Previsão para ${ddmm(fc.endDate)}</span><b>${fmt(fc.end)}</b>${ICON.chevR}</button>
        </section>
        <div class="stack">
          ${monthNav()}
          <div class="stats">
            <div class="stat"><small><i class="dot pos"></i>Entradas</small><b class="pos-t">${fmt(st.inc)}</b></div>
            <div class="stat"><small><i class="dot neg"></i>Saídas</small><b>${fmt(st.exp)}</b></div>
            <div class="stat"><small>Resultado</small><b class="${st.net >= 0 ? 'pos-t' : 'neg-t'}">${fmt(st.net, { sign: true })}</b></div>
          </div>
          ${insightsHtml(ym, st)}
        </div>
      </div>
      <div class="grid2">
        <section class="card"><div class="card-head"><h3>Gastos por categoria</h3><small>${monthLabel(ym)}</small></div>
          ${st.exp ? donutBlock(catSegments(st.byCat), st.exp) : emptyBox('🍃', 'Nenhum gasto neste mês', '')}</section>
        <section class="card"><div class="card-head"><h3>Últimos 6 meses</h3><small>toque num mês</small></div>
          ${barsSvg(months, ym)}
          <div class="chart-key"><span><i style="background:var(--pos)"></i>Entradas</span><span><i style="background:var(--neg)"></i>Saídas</span></div></section>
      </div>
      ${cardsHome()}
      <section class="card"><div class="card-head"><h3>Seus potes</h3><a class="link" href="#potes">Ver todos</a></div>
        <div class="pot-row">${pots}<button class="pot-mini add" data-action="pot-new">＋<br>Novo pote</button></div></section>
      <section class="card"><div class="card-head"><h3>Últimos lançamentos</h3><a class="link" href="#extrato">Ver extrato</a></div>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>` : emptyBox('🧾', 'Nada por aqui ainda', 'Seus lançamentos vão aparecer aqui.', '<br><button class="btn primary" data-action="new-tx">Registrar o primeiro</button>')}</section>
    </div>`;
  }

  function filteredItems() {
    const { q, type, cat, acc, day, all } = UI.filters, ym = UI.month, ql = norm(q);
    const inRange = (d) => (day ? d === day : all || d.startsWith(ym));
    const items = [];
    if (type !== 'pot') for (const tx of S.transactions) {
      if (!inRange(tx.date)) continue;
      if (type !== 'all' && tx.type !== type) continue;
      if (cat && tx.categoryId !== cat) continue;
      if (acc && tx.accountId !== acc && tx.toAccountId !== acc) continue;
      if (ql && !norm(`${tx.desc} ${tx.note || ''} ${getCat(tx.categoryId).name} ${toInput(tx.amount)}`).includes(ql)) continue;
      items.push({ kind: 'tx', date: tx.date, createdAt: tx.createdAt, tx });
    }
    if ((type === 'all' || type === 'pot') && !cat) for (const m of S.potMoves) {
      if (!inRange(m.date)) continue;
      if (acc && m.accountId !== acc) continue;
      if (ql && !norm(`${getPot(m.potId)?.name || ''} ${m.note || ''}`).includes(ql)) continue;
      items.push({ kind: 'move', date: m.date, createdAt: m.createdAt, m });
    }
    return items.sort(byDateDesc);
  }
  function allItems() {
    return [...S.transactions.map((tx) => ({ kind: 'tx', date: tx.date, createdAt: tx.createdAt, tx })), ...S.potMoves.map((m) => ({ kind: 'move', date: m.date, createdAt: m.createdAt, m }))].sort(byDateDesc);
  }

  function viewExtrato() {
    const f = UI.filters;
    const types = [['all', 'Tudo'], ['expense', 'Saídas'], ['income', 'Entradas'], ['transfer', 'Transferências'], ['pot', 'Potes']];
    const catOpts = ['expense', 'income'].map((tp) => `<optgroup label="${tp === 'expense' ? 'Despesas' : 'Receitas'}">${S.categories.filter((c) => c.type === tp).map((c) => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
    const head = f.all
      ? `<div class="banner"><span>🔎 Buscando em <b>todos os meses</b></span><button class="btn sm ghost" data-action="toggle-all">Voltar para ${monthName(UI.month).toLowerCase()}</button></div>`
      : monthNav();
    return `<div class="page">
      ${head}
      <div class="filters">
        <div class="search">${ICON.search}<input class="input" id="ext-q" data-filter="q" placeholder="Buscar por nome, categoria ou valor…" value="${esc(f.q)}" aria-label="Buscar lançamentos"></div>
        <div class="chips-scroll">${types.map(([v, l]) => `<button class="chip ${f.type === v ? 'on' : ''}" data-action="filter-type" data-v="${v}">${l}</button>`).join('')}${f.all ? '' : '<button class="chip" data-action="toggle-all">Todos os meses</button>'}${f.day ? `<button class="chip on" data-action="clear-day">Dia ${Number(f.day.slice(8))} ✕</button>` : ''}</div>
        <div class="filter-row">
          <select class="input" data-filter="cat" aria-label="Categoria"><option value="">Todas as categorias</option>${catOpts}</select>
          <select class="input" data-filter="acc" aria-label="Conta"><option value="">Todas as contas</option>${accOptions(f.acc)}</select>
        </div>
        <div class="toolbar">
          ${f.all ? '<span></span>' : `<div class="seg seg-sm"><button data-action="ext-mode" data-v="list" class="${UI.mode === 'list' ? 'on' : ''}">${ICON.list} Lista</button><button data-action="ext-mode" data-v="cal" class="${UI.mode === 'cal' ? 'on' : ''}">${ICON.calendar} Calendário</button></div>`}
          <button class="btn sm ghost" data-action="import-statement">${ICON.up} Importar extrato</button>
        </div>
      </div>
      <section class="card" id="tx-card"></section>
    </div>`;
  }
  function renderTxList() {
    const box = $('#tx-card');
    if (!box) return;
    if (UI.mode === 'cal' && !UI.filters.all) { box.innerHTML = calendarHtml(UI.month); return; }
    const items = filteredItems();
    if (!items.length) {
      const hasFilter = UI.filters.q || UI.filters.type !== 'all' || UI.filters.cat || UI.filters.acc || UI.filters.day || UI.filters.all;
      box.innerHTML = hasFilter ? emptyBox('🔍', 'Nada encontrado', 'Tente mudar os filtros.') : emptyBox('🗓️', `Sem lançamentos em ${monthName(UI.month).toLowerCase()}`, 'Use o botão + para registrar.', '<br><button class="btn primary" data-action="new-tx">Novo lançamento</button>');
      return;
    }
    let inc = 0, exp = 0;
    const groups = new Map();
    for (const it of items) {
      if (it.kind === 'tx') { if (it.tx.type === 'income') inc += it.tx.amount; if (it.tx.type === 'expense') exp += it.tx.amount; }
      if (!groups.has(it.date)) groups.set(it.date, []);
      groups.get(it.date).push(it);
    }
    let html = `<div class="list-summary"><span>${items.length} lançamento${items.length > 1 ? 's' : ''}</span><span>Entradas <b>${fmt(inc)}</b></span><span>Saídas <b>${fmt(exp)}</b></span></div><div class="tx-list">`;
    for (const [date, list] of groups) {
      const net = list.reduce((s, it) => s + (it.kind === 'tx' ? (it.tx.type === 'income' ? it.tx.amount : it.tx.type === 'expense' ? -it.tx.amount : 0) : 0), 0);
      html += `<div class="day-head"><span>${dateLabel(date)}</span><span>${net ? fmt(net, { sign: true }) : ''}</span></div>`;
      html += list.map((it) => (it.kind === 'tx' ? txRow(it.tx) : moveRow(it.m))).join('');
    }
    html += `</div><div class="list-foot"><button class="btn sm ghost" data-action="export-csv" data-scope="filtered">${ICON.file} Exportar esta lista (CSV)</button></div>`;
    box.innerHTML = html;
  }

  function viewPotes() {
    const total = totalPots();
    const goals = S.pots.filter((p) => p.goal);
    const goalSum = goals.reduce((s, p) => s + p.goal, 0);
    const goalSaved = goals.reduce((s, p) => s + Math.min(Math.max(potBalance(p.id), 0), p.goal), 0);
    const used = new Set(S.pots.map((p) => p.name.toLowerCase()));
    const tpls = POT_TEMPLATES.map((t, i) => ({ ...t, i })).filter((t) => !used.has(t.name.toLowerCase()));
    const tplHtml = tpls.length ? `<h4 class="section-title">Ideias de potes</h4><div class="templates">${tpls.map((t) => `<button class="tpl" data-action="pot-new" data-tpl="${t.i}"><span>${t.icon}</span>${t.name}</button>`).join('')}</div>` : '';
    const cards = S.pots.map((p) => {
      const info = potInfo(p);
      return `<article class="pot ${info.done ? 'done' : ''}" style="--c:${p.color}" data-action="pot-detail" data-id="${p.id}" tabindex="0">
        ${info.done ? '<span class="pot-badge">🏆 Concluído</span>' : ''}
        <div class="pot-head"><span class="jar" style="--p:${p.goal ? info.pct : 100}%">${p.icon}</span><div><h4>${esc(p.name)}</h4><small>${deadlineText(p)}</small></div></div>
        <div class="pot-value">${fmt(info.bal)} ${p.goal ? `<small>de ${fmt(p.goal)}</small>` : ''}</div>
        ${p.goal ? `<div class="bar"><i style="width:${info.pct}%"></i></div>` : ''}
        <div class="pot-foot"><span>${p.goal ? Math.floor(info.pct) + '%' : ''}</span><span>${info.hint}</span></div>
        <div class="pot-actions">
          <button class="btn sm primary" data-action="pot-move" data-id="${p.id}" data-dir="in">${ICON.down} Guardar</button>
          <button class="btn sm ghost" data-action="pot-move" data-id="${p.id}" data-dir="out">${ICON.up} Resgatar</button>
        </div>
      </article>`;
    }).join('');
    return `<div class="page">
      <section class="card pots-hero">
        <div><small>Total guardado nos potes</small><div class="big">${fmt(total)}</div>
          <small>${S.pots.length} pote${S.pots.length === 1 ? '' : 's'}${goalSum ? ` · ${Math.floor((goalSaved / goalSum) * 100)}% das metas alcançado` : ''}</small></div>
        <div class="row-btns"><button class="btn ghost" data-action="pot-distribute">⚡ Distribuir</button><button class="btn primary" data-action="pot-new">${ICON.plus} Novo pote</button></div>
      </section>
      ${S.pots.length ? `<div class="pots-grid">${cards}</div>` : `<section class="card">${emptyBox('🫙', 'Separe seu dinheiro em potes', 'Crie potes para cada objetivo — reserva de emergência, viagem, um celular novo… e acompanhe quanto falta.')}</section>`}
      ${tplHtml}
    </div>`;
  }

  function viewPlanejar() {
    const ym = UI.month, st = monthStats(ym);
    // Orçamentos
    const bcats = S.categories.filter((c) => c.type === 'expense' && c.budget > 0);
    let budgetHtml;
    if (!bcats.length) {
      budgetHtml = emptyBox('🎯', 'Defina limites de gasto', 'Escolha quanto quer gastar por categoria no mês e acompanhe aqui.', '<br><button class="btn primary" data-action="budget-edit">Definir orçamentos</button>');
    } else {
      const totB = bcats.reduce((s, c) => s + c.budget, 0);
      const totS = bcats.reduce((s, c) => s + (st.byCat[c.id] || 0), 0);
      const row = (icon, name, spent, budget, extra = '') => {
        const p = spent / budget;
        const cls = p >= 1 ? 'over' : p >= 0.8 ? 'warn' : '';
        const left = budget - spent;
        return `<div class="budget ${extra}"><div class="budget-top"><span class="e">${icon}</span><span>${name}</span><small>${fmt(spent)} / ${fmt(budget)}</small></div>
          <div class="bar ${cls}"><i style="width:${Math.min(100, p * 100)}%"></i></div>
          <div class="budget-left ${left < 0 ? 'over' : ''}">${left >= 0 ? `Ainda pode gastar ${fmt(left)}` : `Passou ${fmt(-left)} do limite`}</div></div>`;
      };
      budgetHtml = row('📊', 'Total dos orçamentos', totS, totB, 'budget-total') + bcats.map((c) => row(c.icon, esc(c.name), st.byCat[c.id] || 0, c.budget)).join('');
    }
    // Fixos do mês: contas a pagar e receitas que se repetem
    const bills = [...S.bills].sort((a, b) => a.day - b.day);
    let toPay = 0, toReceive = 0;
    const billRows = bills.map((b) => {
      const s = billStatus(b, ym), inc = b.type === 'income';
      if (s.key !== 'paid') { if (inc) toReceive += b.amount; else toPay += b.amount; }
      const c = getCat(b.categoryId);
      return `<div class="bill">
        <button class="bill-main" data-action="bill-edit" data-id="${b.id}">
          <span class="bill-day"><b>${b.day}</b><small>${monthShort(ym)}</small></span>
          <span class="bill-info"><b>${c.icon} ${esc(b.name)}${b.auto ? ' <em class="tag">auto</em>' : ''}</b><small><span class="${inc ? 'pos-t' : ''}">${inc ? '+' : ''}${fmt(b.amount)}</span> <span class="status ${s.key}">${s.label}</span></small></span>
        </button>
        ${s.key === 'paid' ? `<button class="btn sm ghost" data-action="bill-unpay" data-id="${b.id}">Desfazer</button>` : `<button class="btn sm soft" data-action="bill-pay" data-id="${b.id}">${inc ? 'Receber' : 'Pagar'}</button>`}
      </div>`;
    }).join('');
    const billsHtml = bills.length
      ? `<div class="bills-sum"><div><small>Falta pagar</small><b>${fmt(toPay)}</b></div><div><small>Falta receber</small><b class="pos-t">${fmt(toReceive)}</b></div></div>${billRows}`
      : emptyBox('🧾', 'Nada fixo cadastrado', 'Cadastre aluguel, internet, assinaturas e também o salário. Eles podem até ser lançados sozinhos todo mês.', '<br><button class="btn primary" data-action="bill-new">Adicionar fixo</button>');

    return `<div class="page">
      ${monthNav()}
      <div class="grid2">
        <section class="card"><div class="card-head"><h3>Orçamento do mês</h3>${bcats.length ? '<button class="btn sm ghost" data-action="budget-edit">Editar</button>' : ''}</div>${budgetHtml}</section>
        <section class="card"><div class="card-head"><h3>Fixos do mês</h3>${bills.length ? `<button class="btn sm soft" data-action="bill-new">${ICON.plus} Nova</button>` : ''}</div>${billsHtml}</section>
      </div>
      ${ruleCard(ym, st)}
    </div>`;
  }

  function ruleCard(ym, st) {
    const head = '<div class="card-head"><h3>Regra 50 · 30 · 20</h3><small>como sua renda foi usada</small></div>';
    if (!st.inc) return `<section class="card">${head}${emptyBox('⚖️', 'Sem receitas neste mês', 'Registre o que entrou (salário, freelas…) para ver como você dividiu seu dinheiro.')}</section>`;
    let needs = 0, wants = 0;
    for (const [cid, v] of Object.entries(st.byCat)) { if (getCat(cid).need) needs += v; else wants += v; }
    const saved = Math.max(0, S.potMoves.filter((m) => m.date.startsWith(ym)).reduce((s, m) => s + m.amount, 0));
    const rows = [
      { label: 'Necessidades', sub: 'moradia, mercado, contas, saúde, transporte', v: needs, target: 50, color: '#3b82f6', bad: (p) => p > 55 },
      { label: 'Desejos', sub: 'lazer, delivery, compras, assinaturas', v: wants, target: 30, color: '#f59e0b', bad: (p) => p > 35 },
      { label: 'Guardado nos potes', sub: 'seu futuro agradece', v: saved, target: 20, color: 'var(--accent)', bad: (p) => p < 15 },
    ];
    const pcts = rows.map((r) => (r.v / st.inc) * 100);
    const issues = rows.filter((r, i) => r.bad(pcts[i]));
    const verdict = !issues.length ? '✅ Mandou bem! Sua divisão está bem equilibrada.'
      : issues[0].label === 'Guardado nos potes' && issues.length === 1 ? '💡 Tente guardar pelo menos 20% do que entra — use o botão <b>Distribuir</b> nos potes.'
        : `💡 ${issues.map((r) => r.label).filter((l) => l !== 'Guardado nos potes').join(' e ')} ${issues.filter((r) => r.label !== 'Guardado nos potes').length > 1 ? 'estão' : 'está'} acima do ideal. Vale revisar esses gastos.`;
    return `<section class="card">${head}
      ${rows.map((r, i) => `<div class="rule-row"><div><b>${r.label}</b><br><small>${r.sub}</small></div><div class="r-val">${Math.round(pcts[i])}%<small>ideal ${r.target}% · ${fmt(r.v)}</small></div>
        <div class="rule-bar"><i style="width:${Math.min(100, pcts[i])}%;--c:${r.color}"></i><u style="left:${r.target}%"></u></div></div>`).join('')}
      <div class="verdict">${verdict}</div></section>`;
  }

  let installPrompt = null;
  function viewAjustes() {
    const exp = S.categories.filter((c) => c.type === 'expense'), inc = S.categories.filter((c) => c.type === 'income');
    const chip = (c) => `<button class="cat-chip" style="--c:${c.color}" data-action="cat-edit" data-id="${c.id}"><span class="e">${c.icon}</span>${esc(c.name)}${c.budget ? `<small>${fmtShort(c.budget)}/mês</small>` : ''}</button>`;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return `<div class="settings">
      ${cloudCard()}
      <section class="card"><h3>Perfil</h3>
        <label class="field"><span>Seu nome</span><input data-setting="name" value="${esc(S.settings.name)}" placeholder="Como quer ser chamado?"></label>
        <h3 style="margin-top:18px;margin-bottom:10px">Aparência</h3>
        <div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => `<button data-action="theme" data-v="${v}" class="${S.settings.theme === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="switch-row"><span>Ocultar valores na tela</span><button class="switch ${S.settings.hideValues ? 'on' : ''}" data-action="toggle-hide" role="switch" aria-checked="${S.settings.hideValues}" aria-label="Ocultar valores"></button></div>
      </section>
      <section class="card"><div class="card-head"><h3>Contas e cartões</h3><div class="row-btns">${S.accounts.length > 1 ? `<button class="btn sm ghost" data-action="transfer">${ICON.swap} Transferir</button>` : ''}<button class="btn sm soft" data-action="acc-new">${ICON.plus} Nova</button></div></div>
        ${S.accounts.map((a) => { const b = accBalance(a.id); return `<button class="list-row" data-action="acc-edit" data-id="${a.id}"><span class="tx-ic" style="--c:${a.color}">${a.icon}</span><span>${esc(a.name)}${isCard(a) ? `<br><small class="muted">Cartão · fecha dia ${a.closeDay}, vence dia ${a.dueDay}</small>` : ''}</span><b class="${b < 0 ? 'neg-t' : ''}">${fmt(b)}</b></button>`; }).join('')}
        <p class="muted small" style="margin-top:8px">Toque numa conta para editar ou ajustar o saldo.</p>
      </section>
      <section class="card span2"><div class="card-head"><h3>Categorias</h3></div>
        <h4 class="mini-title">Despesas</h4><div class="cat-grid">${exp.map(chip).join('')}<button class="cat-chip add" data-action="cat-new" data-type="expense"><span class="e">＋</span>Nova</button></div>
        <h4 class="mini-title" style="margin-top:16px">Receitas</h4><div class="cat-grid">${inc.map(chip).join('')}<button class="cat-chip add" data-action="cat-new" data-type="income"><span class="e">＋</span>Nova</button></div>
      </section>
      <section class="card"><h3>Backup e dados</h3>
        ${user
          ? '<p class="muted small">Seus dados ficam na sua conta e também neste aparelho, então o app funciona sem internet. O backup é uma cópia extra de segurança.</p>'
          : '<p class="muted small">Seus dados ficam salvos <b>só neste navegador</b>. Exporte um backup de vez em quando, ou entre numa conta para sincronizar entre aparelhos.</p>'}
        <div class="btn-grid">
          <button class="btn ghost" data-action="export-json">${ICON.down} Exportar backup</button>
          <button class="btn ghost" data-action="import-json">${ICON.up} Importar backup</button>
          <button class="btn ghost" data-action="export-csv">${ICON.file} Planilha (CSV)</button>
          <button class="btn ghost" data-action="import-statement">${ICON.up} Importar extrato do banco</button>
          ${installPrompt ? '<button class="btn soft" data-action="install">📲 Instalar app</button>' : ''}
        </div>
        ${!installPrompt ? `<p class="muted small" style="margin-top:12px">📲 <b>Usar como app:</b> ${isIOS ? 'no Safari, toque em Compartilhar → “Adicionar à Tela de Início”.' : 'no menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”.'}</p>` : ''}
      </section>
      <section class="card"><h3>Zona de perigo</h3>
        <p class="muted small">Apaga todos os lançamentos, potes e configurações deste aparelho.</p>
        <div class="btn-grid"><button class="btn danger-ghost" data-action="reset-all">Apagar todos os dados</button></div>
      </section>
      <p class="foot muted span2">Banco do Murilo · v1.0 · feito pra usar todo dia 💚</p>
    </div>`;
  }

  const VIEWS = {
    inicio: { title: 'Início', icon: 'home', render: viewInicio },
    extrato: { title: 'Extrato', icon: 'list', render: viewExtrato, mount: renderTxList, sub: 'Tudo que entrou e saiu' },
    potes: { title: 'Potes', icon: 'jar', render: viewPotes, sub: 'Separe dinheiro e bata suas metas' },
    planejar: { title: 'Planejar', icon: 'target', render: viewPlanejar, sub: 'Orçamentos, fixos do mês e equilíbrio' },
    cartoes: { title: 'Cartões', icon: 'card', render: viewCartoes, sub: 'Faturas, limite e vencimentos' },
    dividas: { title: 'Dívidas', icon: 'people', render: viewDividas, sub: 'Quem te deve e para quem você deve' },
    relatorios: { title: 'Relatórios', icon: 'chart', render: viewRelatorios, sub: 'Seu ano em números' },
    ajustes: { title: 'Ajustes', icon: 'gear', render: viewAjustes, sub: 'Conta, categorias e backup' },
  };
  const MAIN_NAV = ['inicio', 'extrato', 'potes', 'planejar'];
  const MORE = ['cartoes', 'dividas', 'relatorios', 'ajustes'];
  const currentView = () => { const r = location.hash.slice(1); return VIEWS[r] ? r : 'inicio'; };

  function renderShell() {
    const link = (id) => `<a href="#${id}" data-nav="${id}">${ICON[VIEWS[id].icon]}<span>${VIEWS[id].title}</span></a>`;
    $('.side-nav').innerHTML = Object.keys(VIEWS).map(link).join('');
    $('.bottomnav').innerHTML = MAIN_NAV.map(link).join('') + `<button data-action="more" data-nav="more">${ICON.dots}<span>Mais</span></button>`;
  }
  function renderTop(view) {
    let title = VIEWS[view].title, sub = VIEWS[view].sub || '';
    if (view === 'inicio') {
      const h = new Date().getHours();
      const first = (S.settings.name || '').trim().split(/\s+/)[0];
      title = `${h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${first ? ', ' + esc(first) : ''} 👋`;
      sub = cap(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
    }
    $('#topbar').innerHTML = `<div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
      <div class="top-actions">
        <span data-sync-slot>${syncPill()}</span>
        <button class="icon-btn" data-action="toggle-hide" aria-label="Mostrar ou ocultar valores" title="Ocultar valores">${S.settings.hideValues ? ICON.eyeOff : ICON.eye}</button>
        <button class="btn primary desk-only" data-action="new-tx">${ICON.plus} Novo lançamento</button>
      </div>`;
  }
  function render() {
    if (!started) return;
    const view = currentView();
    renderTop(view);
    $('#view').innerHTML = VIEWS[view].render();
    VIEWS[view].mount?.();
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === view || (a.dataset.nav === 'more' && MORE.includes(view))));
    const avail = totalAvailable(), pots = totalPots(), debt = cardDebt();
    $('#side-foot').innerHTML = `<small>Patrimônio total</small><b>${fmt(avail + pots - debt)}</b><small style="margin-top:4px">${fmt(avail)} livre · ${fmt(pots)} nos potes${debt ? ` · ${fmt(debt)} em cartões` : ''}</small>`;
  }
  function applyTheme() {
    const t = S.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    ls.set(THEME_KEY, t);
    $('meta[name=theme-color]').setAttribute('content', dark ? '#0e1012' : '#f3f2ee');
  }

  // ================= Modal, toast, confete =================
  const modalStack = [];
  function openModal({ title, body, onMount, size = '', onClose }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal-backdrop" data-close></div>
      <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-grip"></div>
        <header class="modal-head"><h2>${title}</h2><button class="icon-btn" data-close aria-label="Fechar">${ICON.x}</button></header>
        <div class="modal-body">${body}</div>
      </div>`;
    $('#modal-root').appendChild(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('open')));
    document.body.classList.add('no-scroll');
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 260);
      modalStack.splice(modalStack.indexOf(close), 1);
      if (!modalStack.length) document.body.classList.remove('no-scroll');
      onClose?.();
    };
    wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    modalStack.push(close);
    onMount?.(wrap, close);
    return close;
  }
  const closeTop = () => modalStack[modalStack.length - 1]?.();

  function confirmBox({ title, text, ok = 'Confirmar', danger = false, onOk }) {
    openModal({
      title, size: 'small',
      body: `<p class="muted">${text}</p><div class="modal-actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${ok}</button></div>`,
      onMount: (w, close) => { $('[data-ok]', w).onclick = () => { close(); onOk(); }; },
    });
  }

  function toast(msg, { undo } = {}) {
    buzz();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Desfazer</button>' : ''}`;
    $('#toast-root').appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    const kill = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 260); };
    if (undo) el.querySelector('button').onclick = () => { undo(); kill(); };
    setTimeout(kill, undo ? 5500 : 2600);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.focus(); }

  function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = ['#0f9d6e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#22c55e', '#ef4444'];
    for (let i = 0; i < 110; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.5 + 's';
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      p.style.setProperty('--x', Math.random() * 240 - 120 + 'px');
      p.style.setProperty('--r', Math.random() * 900 + 'deg');
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  }
  function celebrateIfDone(potId, before) {
    const p = getPot(potId);
    if (p && p.goal && before < p.goal && potBalance(potId) >= p.goal) {
      setTimeout(() => { confetti(); toast(`Meta “${p.name}” atingida! 🎉`); }, 300);
      return true;
    }
    return false;
  }

  // Seletores de emoji/cor reutilizáveis
  function emojiPicker(list, cur) {
    const all = list.includes(cur) ? list : [cur, ...list];
    return `<div class="emoji-pick" data-pick="icon">${all.map((e) => `<button type="button" class="${e === cur ? 'on' : ''}" data-v="${e}">${e}</button>`).join('')}</div>`;
  }
  const swatchPicker = (cur) => `<div class="swatches" data-pick="color">${PALETTE.map((c) => `<button type="button" class="swatch ${c === cur ? 'on' : ''}" style="--c:${c}" data-v="${c}" aria-label="Cor ${c}"></button>`).join('')}</div>`;
  function bindPickers(root, state) {
    $$('[data-pick]', root).forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      $$('[data-v]', g).forEach((x) => x.classList.toggle('on', x === b));
      state[g.dataset.pick] = b.dataset.v;
    }));
  }

  // ================= Lançamentos =================
  function txModal(tx, preset = {}) {
    const isEdit = !!tx;
    const firstCash = cashOrAll()[0].id;
    const d = tx ? { ...tx } : {
      type: preset.type || 'expense', amount: preset.amount || 0, desc: '', categoryId: null,
      accountId: firstCash, toAccountId: (S.accounts.find((a) => a.id !== firstCash) || S.accounts[0]).id, date: todayStr(), note: '',
    };
    const shortcuts = isEdit ? [] : frequentTx();
    let type = d.type, cat = d.categoryId;
    const descs = [...new Set([...S.transactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((t) => t.desc.replace(/ \(\d+\/\d+\)$/, '')).filter(Boolean))].slice(0, 100);
    const canTransfer = S.accounts.length > 1;
    openModal({
      title: isEdit ? 'Editar lançamento' : 'Novo lançamento',
      body: `<form class="form" autocomplete="off" novalidate>
        <div class="seg">
          <button type="button" data-t="expense">Despesa</button>
          <button type="button" data-t="income">Receita</button>
          ${canTransfer || type === 'transfer' ? '<button type="button" data-t="transfer">Transferência</button>' : ''}
        </div>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" value="${toInput(d.amount)}" aria-label="Valor (aceita contas como 12+8,50)"></label>
        <div class="calc-hint" id="calc-hint"></div>
        ${!isEdit ? '<div class="shortcuts" id="shortcuts"></div>' : ''}
        <label class="field"><span>Descrição</span><input name="desc" list="desc-list" placeholder="Ex: Almoço, Uber, Mercado…" value="${esc(d.desc)}" maxlength="80"></label>
        <datalist id="desc-list">${descs.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
        <div class="field cat-field"><span>Categoria</span><div class="cat-grid" id="cat-grid"></div></div>
        <div class="row2">
          <label class="field"><span id="acc-label">Conta</span><select name="accountId">${accOptions(d.accountId)}</select><small id="card-hint"></small></label>
          <label class="field to-acc"><span>Para</span><select name="toAccountId">${accOptions(d.toAccountId)}</select></label>
          <label class="field"><span>Data</span><input type="date" name="date" value="${d.date}"></label>
        </div>
        ${!isEdit ? `<label class="field inst-field"><span>Pagamento</span><select name="inst">${Array.from({ length: 24 }, (_, i) => `<option value="${i + 1}">${i === 0 ? 'À vista' : `Parcelado em ${i + 1}x`}</option>`).join('')}</select><small id="inst-hint"></small></label>` : ''}
        <label class="field"><span>Observação</span><input name="note" value="${esc(d.note)}" placeholder="Opcional" maxlength="140"></label>
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button><button type="button" class="btn ghost" data-dup>Duplicar</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Adicionar'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        const paint = () => {
          $$('.seg [data-t]', w).forEach((b) => b.classList.toggle('on', b.dataset.t === type));
          $('.modal', w).dataset.type = type;
          $('.cat-field', w).hidden = type === 'transfer';
          $('.to-acc', w).hidden = type !== 'transfer';
          const inst = $('.inst-field', w);
          if (inst) inst.hidden = type !== 'expense';
          $('#acc-label', w).textContent = type === 'transfer' ? 'De' : type === 'income' ? 'Entrou em' : 'Saiu de';
          const accList = type === 'transfer' ? cashOrAll() : S.accounts;
          const curAcc = el.accountId.value;
          el.accountId.innerHTML = accOptions(accList.some((a) => a.id === curAcc) ? curAcc : accList[0].id, accList);
          cardHint();
          const sc = $('#shortcuts', w);
          if (sc) {
            const items = type === 'transfer' ? [] : shortcuts.filter((t) => t.type === type);
            sc.innerHTML = items.length ? `<span>Rápidos</span>${items.map((t) => `<button type="button" class="chip" data-sc="${t.id}">${getCat(t.categoryId).icon} ${esc(t.desc.replace(/ \(\d+\/\d+\)$/, ''))} · ${fmtShort(t.amount)}</button>`).join('')}` : '';
          }
          const cats = S.categories.filter((c) => c.type === type);
          if (cat && !cats.some((c) => c.id === cat)) cat = null;
          $('#cat-grid', w).innerHTML = cats.map((c) => `<button type="button" class="cat-chip ${c.id === cat ? 'on' : ''}" style="--c:${c.color}" data-cat="${c.id}"><span class="e">${c.icon}</span>${esc(c.name)}</button>`).join('');
        };
        $$('.seg [data-t]', w).forEach((b) => (b.onclick = () => { type = b.dataset.t; paint(); }));
        // Avisa em qual fatura a compra no cartão vai cair
        function cardHint() {
          const a = getAcc(el.accountId.value), h = $('#card-hint', w);
          h.textContent = isCard(a) && type === 'expense' && a.closeDay ? `💳 Entra na fatura que vence em ${shortDate(cycleFor(a, el.date.value || todayStr()).due)}` : '';
        }
        el.accountId.addEventListener('change', cardHint);
        el.date.addEventListener('change', cardHint);
        const calcHint = () => {
          const v = el.amount.value;
          $('#calc-hint', w).textContent = /\d\s*[-+*/x×÷]\s*\d/i.test(v) ? `= ${fmt(evalMoney(v), { force: true })}` : '';
        };
        el.amount.addEventListener('input', calcHint);
        el.amount.addEventListener('blur', () => { if ($('#calc-hint', w).textContent) { el.amount.value = toInput(evalMoney(el.amount.value)); calcHint(); } });
        $('#shortcuts', w)?.addEventListener('click', (e) => {
          const b = e.target.closest('[data-sc]');
          const t = b && shortcuts.find((x) => x.id === b.dataset.sc);
          if (!t) return;
          type = t.type; cat = t.categoryId;
          el.desc.value = t.desc.replace(/ \(\d+\/\d+\)$/, '');
          el.amount.value = toInput(t.amount);
          paint();
          if (S.accounts.some((a) => a.id === t.accountId)) el.accountId.value = t.accountId;
          cardHint(); calcHint(); buzz();
        });
        $('#cat-grid', w).onclick = (e) => {
          const b = e.target.closest('[data-cat]');
          if (!b) return;
          cat = b.dataset.cat;
          $$('[data-cat]', w).forEach((x) => x.classList.toggle('on', x === b));
        };
        // Ao escolher uma descrição já usada, preenche a categoria e a conta automaticamente
        el.desc.addEventListener('change', () => {
          const v = el.desc.value.trim().toLowerCase();
          if (!v || isEdit) return;
          const prev = S.transactions.filter((t) => t.type !== 'transfer' && t.desc.replace(/ \(\d+\/\d+\)$/, '').toLowerCase() === v).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
          if (prev) { type = prev.type; cat = prev.categoryId; paint(); if (S.accounts.some((a) => a.id === prev.accountId)) el.accountId.value = prev.accountId; cardHint(); }
          else if (!cat && type !== 'transfer') { const g = guessCategory(el.desc.value, type); if (g) { cat = g; paint(); } }
        });
        const hint = () => {
          const h = $('#inst-hint', w);
          if (!h) return;
          const n = Number(el.inst.value), a = evalMoney(el.amount.value);
          h.textContent = n > 1 && a ? `${n}x de ${fmt(Math.round(a / n), { force: true })} — uma parcela por mês a partir da data escolhida` : '';
        };
        el.amount.addEventListener('input', hint);
        el.inst?.addEventListener('change', hint);
        paint();
        if (!isEdit) setTimeout(() => el.amount.focus(), 280);
        if (isEdit) $('[data-del]', w).onclick = () => { close(); deleteTx(tx.id); };
        if (isEdit) $('[data-dup]', w).onclick = () => {
          const src = S.transactions.find((t) => t.id === tx.id);
          if (!src) return;
          const copy = { ...src, id: uid(), desc: src.desc.replace(/ \(\d+\/\d+\)$/, ''), date: todayStr(), createdAt: Date.now() };
          delete copy.group; delete copy.extId;
          S.transactions.push(copy);
          save(); close(); render(); toast('Lançamento duplicado com a data de hoje');
        };

        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = evalMoney(el.amount.value);
          if (amount <= 0) { shake(el.amount); return toast('Digite um valor'); }
          const accountId = el.accountId.value, toAccountId = el.toAccountId.value;
          if (type === 'transfer' && accountId === toAccountId) return toast('Escolha contas diferentes');
          if (type !== 'transfer' && !cat) {
            const fallback = S.categories.find((c) => c.type === type && /^outros/i.test(c.name)) || S.categories.find((c) => c.type === type);
            cat = fallback ? fallback.id : null;
          }
          const desc = el.desc.value.trim() || (type === 'transfer' ? 'Transferência' : getCat(cat).name);
          const base = {
            type, amount, desc, categoryId: type === 'transfer' ? null : cat, accountId,
            toAccountId: type === 'transfer' ? toAccountId : null, date: el.date.value || todayStr(), note: el.note.value.trim(),
          };
          if (isEdit) {
            const target = S.transactions.find((t) => t.id === tx.id);
            if (target) Object.assign(target, base);
            toast('Lançamento atualizado');
          } else {
            const n = type === 'expense' ? Number(el.inst?.value || 1) : 1;
            if (n > 1) {
              const group = uid(), per = Math.floor(amount / n), day = Number(base.date.slice(8)), now = Date.now();
              for (let i = 0; i < n; i++) {
                S.transactions.push({ ...base, id: uid(), amount: i === 0 ? amount - per * (n - 1) : per, desc: `${desc} (${i + 1}/${n})`, date: dateInMonth(addMonths(base.date.slice(0, 7), i), day), group, createdAt: now + i });
              }
              toast(`Compra parcelada em ${n}x`);
            } else {
              S.transactions.push({ ...base, id: uid(), createdAt: Date.now() });
              toast(type === 'income' ? 'Receita adicionada 💰' : type === 'transfer' ? 'Transferência registrada' : 'Gasto registrado');
            }
          }
          save(); close(); render();
        };
      },
    });
  }

  function deleteTx(id) {
    const tx = S.transactions.find((t) => t.id === id);
    if (!tx) return;
    const doDel = (all) => {
      const snap = snapshot();
      S.transactions = S.transactions.filter((t) => (all ? t.group !== tx.group : t.id !== id));
      save(); render();
      toast(all ? 'Parcelas excluídas' : 'Lançamento excluído', { undo: () => restore(snap) });
    };
    if (tx.group && S.transactions.filter((t) => t.group === tx.group).length > 1) {
      openModal({
        title: 'Excluir parcela', size: 'small',
        body: '<p class="muted">Esse lançamento faz parte de uma compra parcelada.</p><div class="modal-actions col"><button class="btn ghost" data-one>Excluir só esta parcela</button><button class="btn danger" data-all>Excluir todas as parcelas</button></div>',
        onMount: (w, c) => { $('[data-one]', w).onclick = () => { c(); doDel(false); }; $('[data-all]', w).onclick = () => { c(); doDel(true); }; },
      });
    } else doDel(false);
  }

  // ================= Potes =================
  function potModal(pot, tpl = {}) {
    const isEdit = !!pot;
    const d = pot ? { ...pot } : { name: tpl.name || '', icon: tpl.icon || '🫙', color: tpl.color || PALETTE[S.pots.length % PALETTE.length], goal: tpl.goal || 0, deadline: '', percent: 0 };
    const st = { icon: d.icon, color: d.color };
    const avg = avgMonthlyExp();
    const reserveTip = tpl.reserve && avg ? `<small>💡 Sugestão: 6x seus gastos médios (${fmt(avg, { force: true })}/mês) = ${fmt(avg * 6, { force: true })}</small>` : '';
    openModal({
      title: isEdit ? 'Editar pote' : 'Novo pote',
      body: `<form class="form" autocomplete="off" novalidate>
        <label class="field"><span>Nome do pote</span><input name="nome" value="${esc(d.name)}" placeholder="Ex: Viagem pra praia" maxlength="40"></label>
        <div class="field"><span>Ícone</span>${emojiPicker(POT_EMOJIS, d.icon)}</div>
        <div class="field"><span>Cor</span>${swatchPicker(d.color)}</div>
        <div class="row2">
          <label class="field"><span>Meta (opcional)</span><input name="goal" inputmode="decimal" placeholder="R$ 0,00" value="${toInput(d.goal)}"></label>
          <label class="field"><span>Até quando? (opcional)</span><input type="date" name="deadline" value="${d.deadline || ''}" min="${todayStr()}"></label>
        </div>
        ${reserveTip}
        <small class="muted" id="goal-hint"></small>
        <label class="field"><span>% ao distribuir dinheiro</span><input name="percent" type="number" min="0" max="100" inputmode="numeric" value="${d.percent || ''}" placeholder="Ex: 20"><small>Quando você usar “Distribuir”, esse pote recebe essa porcentagem.</small></label>
        ${!isEdit ? `<div class="row2"><label class="field"><span>Já guardar agora</span><input name="first" inputmode="decimal" placeholder="R$ 0,00"></label><label class="field"><span>Saindo de</span><select name="acc">${accOptions(cashOrAll()[0].id, cashOrAll())}</select></label></div>` : ''}
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Criar pote'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        bindPickers(w, st);
        if (tpl.reserve && avg && !el.goal.value) el.goal.value = toInput(avg * 6);
        const hint = () => {
          const g = parseMoney(el.goal.value), dl = el.deadline.value;
          const have = isEdit ? potBalance(pot.id) : parseMoney(el.first?.value);
          const h = $('#goal-hint', w);
          if (g && dl && diffDays(todayStr(), dl) > 0) {
            const months = Math.max(1, Math.ceil(diffDays(todayStr(), dl) / 30.44));
            h.innerHTML = `🎯 Para chegar lá, guarde <b>${fmt(Math.max(0, Math.ceil((g - have) / months)), { force: true })} por mês</b> (${months} ${months === 1 ? 'mês' : 'meses'}).`;
          } else h.textContent = '';
        };
        ['goal', 'deadline', 'first'].forEach((n) => el[n]?.addEventListener('input', hint));
        hint();
        if (!isEdit && !tpl.name) setTimeout(() => el.nome.focus(), 280);
        if (isEdit) $('[data-del]', w).onclick = () => { close(); deletePot(pot.id); };
        f.onsubmit = (e) => {
          e.preventDefault();
          const name = el.nome.value.trim();
          if (!name) { shake(el.nome); return toast('Dê um nome ao pote'); }
          const data = { name, icon: st.icon, color: st.color, goal: parseMoney(el.goal.value), deadline: el.deadline.value || '', percent: Math.min(100, Math.max(0, Number(el.percent.value) || 0)) };
          if (isEdit) {
            Object.assign(getPot(pot.id), data);
            toast('Pote atualizado');
          } else {
            const p = { id: uid(), createdAt: Date.now(), ...data };
            S.pots.push(p);
            const first = parseMoney(el.first.value);
            if (first > 0) S.potMoves.push({ id: uid(), potId: p.id, accountId: el.acc.value, amount: first, date: todayStr(), note: 'Primeiro depósito', createdAt: Date.now() });
            toast(`Pote “${name}” criado ${p.icon}`);
            if (first > 0) celebrateIfDone(p.id, 0);
          }
          save(); close(); render();
        };
      },
    });
  }

  function deletePot(id) {
    const p = getPot(id);
    if (!p) return;
    const bal = potBalance(id);
    confirmBox({
      title: 'Excluir pote?',
      text: bal > 0 ? `O saldo de <b>${fmt(bal, { force: true })}</b> volta para as contas de onde saiu.` : `O pote “${esc(p.name)}” será removido.`,
      ok: 'Excluir', danger: true,
      onOk: () => {
        const snap = snapshot();
        S.pots = S.pots.filter((x) => x.id !== id);
        S.potMoves = S.potMoves.filter((m) => m.potId !== id);
        save(); render();
        toast('Pote excluído', { undo: () => restore(snap) });
      },
    });
  }

  function potDetail(id) {
    const p = getPot(id);
    if (!p) return;
    const info = potInfo(p);
    const moves = S.potMoves.filter((m) => m.potId === id).sort(byDateDesc);
    const daysLeft = p.deadline ? diffDays(todayStr(), p.deadline) : 0;
    const need = p.goal && daysLeft > 0 && !info.done ? Math.ceil((p.goal - info.bal) / Math.max(1, Math.ceil(daysLeft / 30.44))) : 0;
    const tot = (sgn) => moves.filter((m) => Math.sign(m.amount) === sgn).reduce((s, m) => s + Math.abs(m.amount), 0);
    openModal({
      title: `${p.icon} ${esc(p.name)}`,
      body: `<div class="pot-detail" style="--c:${p.color}">
          <span class="jar big" style="--p:${p.goal ? info.pct : 100}%">${p.icon}</span>
          <div class="pd-value">${fmt(info.bal)}</div>
          <div class="muted">${p.goal ? `de ${fmt(p.goal)} · ${Math.floor(info.pct)}%` : 'Pote sem meta'}</div>
          ${p.goal ? `<div class="bar"><i style="width:${info.pct}%"></i></div>` : ''}
          <div class="pd-hint">${info.hint}${p.deadline ? ` · prazo ${shortDate(p.deadline)}` : ''}</div>
        </div>
        <div class="pot-actions three">
          <button class="btn primary" data-action="pot-move" data-id="${id}" data-dir="in">${ICON.down} Guardar</button>
          <button class="btn ghost" data-action="pot-move" data-id="${id}" data-dir="out">${ICON.up} Resgatar</button>
          <button class="btn ghost" data-action="pot-yield" data-id="${id}">📈 Rendeu</button>
        </div>
        <h4 class="section-title">Simulador</h4>
        <div class="sim">
          <div class="row2">
            <label class="field"><span>Guardar por mês</span><input id="sim-m" inputmode="decimal" value="${toInput(need || 10000)}"></label>
            <label class="field"><span>Rende (% ao mês)</span><input id="sim-r" inputmode="decimal" value="${String(p.rate ?? 0.8).replace('.', ',')}"></label>
          </div>
          <p class="sim-out" id="sim-out"></p>
        </div>
        <h4 class="section-title">Histórico</h4>
        ${moves.length ? `<p class="muted small" style="margin:0 2px 4px">Guardado ${fmt(tot(1))} · Resgatado ${fmt(tot(-1))}</p>` : ''}
        <div>${moves.length ? moves.map((m) => `<div class="move">
            <span class="m-ic ${m.amount > 0 ? 'in' : 'out'}">${m.amount > 0 ? '↓' : '↑'}</span>
            <div><b>${m.amount > 0 ? '+' : '−'}${fmt(Math.abs(m.amount)).replace('−', '')}</b><small>${dateLabel(m.date)} · ${m.accountId ? esc(getAcc(m.accountId).name) : 'Rendimento'}${m.note ? ' · ' + esc(m.note) : ''}</small></div>
            <button class="x" data-move-del="${m.id}" aria-label="Apagar movimentação">${ICON.x}</button></div>`).join('') : '<p class="muted small" style="padding:8px 2px">Nenhuma movimentação ainda.</p>'}</div>
        <div class="modal-actions" style="margin-top:16px"><button class="btn ghost" data-action="pot-edit" data-id="${id}">Editar pote</button></div>`,
      onMount(w, close) {
        // Simulador com juros compostos: quanto tempo até a meta, ou quanto terá no futuro
        const sim = () => {
          const m = evalMoney($('#sim-m', w).value) / 100;
          const r = (parseFloat($('#sim-r', w).value.replace(',', '.')) || 0) / 100;
          const goal = (p.goal || 0) / 100, out = $('#sim-out', w);
          let v = potBalance(id) / 100;
          if (goal && v < goal) {
            if (m <= 0 && r <= 0) { out.textContent = 'Diga quanto quer guardar por mês.'; return; }
            let n = 0;
            while (v < goal && n < 600) { v = v * (1 + r) + m; n++; }
            const when = addMonths(curMonth(), n);
            out.innerHTML = n >= 600 ? 'Nesse ritmo a meta fica muito longe. Tente guardar um pouco mais por mês.'
              : `Guardando <b>${fmt(Math.round(m * 100), { force: true })}/mês</b>, você bate a meta em <b>${n} ${n === 1 ? 'mês' : 'meses'}</b> (${monthName(when).toLowerCase()} de ${when.slice(0, 4)}).`;
          } else {
            const proj = (k) => { let x = v; for (let i = 0; i < k; i++) x = x * (1 + r) + m; return Math.round(x * 100); };
            out.innerHTML = `Em 1 ano: <b>${fmt(proj(12), { force: true })}</b> · em 5 anos: <b>${fmt(proj(60), { force: true })}</b>`;
          }
        };
        $('#sim-m', w).addEventListener('input', sim);
        $('#sim-r', w).addEventListener('input', () => {
          sim();
          const rv = parseFloat($('#sim-r', w).value.replace(',', '.'));
          const pot = getPot(id);
          if (pot && !isNaN(rv)) { pot.rate = rv; save(); }
        });
        sim();
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-move-del]');
          if (!b) return;
          const snap = snapshot();
          S.potMoves = S.potMoves.filter((m) => m.id !== b.dataset.moveDel);
          save(); close(); render(); potDetail(id);
          toast('Movimentação apagada', { undo: () => restore(snap) });
        });
      },
    });
  }

  function potMoveModal(potId, dir = 'in', preset = 0) {
    const p = getPot(potId);
    if (!p) return;
    let d = dir;
    openModal({
      title: `${p.icon} ${esc(p.name)}`,
      body: `<form class="form" autocomplete="off" novalidate>
        <div class="seg"><button type="button" data-d="in">Guardar</button><button type="button" data-d="out">Resgatar</button></div>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" value="${toInput(preset)}" aria-label="Valor"></label>
        <div class="quick-amts" id="quick"></div>
        <label class="field"><span id="acc-l">Conta</span><select name="acc">${accOptions(cashOrAll()[0].id, cashOrAll())}</select><small id="acc-bal"></small></label>
        <div class="row2">
          <label class="field"><span>Data</span><input type="date" name="date" value="${todayStr()}"></label>
          <label class="field"><span>Observação</span><input name="note" placeholder="Opcional" maxlength="80"></label>
        </div>
        <button class="btn primary block" type="submit" id="mv-btn">Guardar</button>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        const paint = () => {
          const bal = potBalance(potId);
          $$('[data-d]', w).forEach((b) => b.classList.toggle('on', b.dataset.d === d));
          $('#acc-l', w).textContent = d === 'in' ? 'Tirar dinheiro de' : 'Devolver para';
          $('#mv-btn', w).textContent = d === 'in' ? 'Guardar no pote' : 'Resgatar do pote';
          const q = d === 'in' ? [5000, 10000, 20000, 50000] : [];
          let chips = q.map((v) => `<button type="button" class="chip" data-q="${v}">+${fmt(v, { force: true }).replace(',00', '')}</button>`).join('');
          if (d === 'in' && p.goal && p.goal > bal) chips += `<button type="button" class="chip" data-set="${p.goal - bal}">Completar meta</button>`;
          if (d === 'out' && bal > 0) chips += `<button type="button" class="chip" data-set="${bal}">Tudo (${fmt(bal, { force: true })})</button>`;
          $('#quick', w).innerHTML = chips;
          $('#acc-bal', w).textContent = `Saldo da conta: ${fmt(accBalance(el.acc.value), { force: true })} · No pote: ${fmt(bal, { force: true })}`;
        };
        $$('[data-d]', w).forEach((b) => (b.onclick = () => { d = b.dataset.d; paint(); }));
        el.acc.addEventListener('change', paint);
        $('#quick', w).onclick = (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          const cur = parseMoney(el.amount.value);
          el.amount.value = toInput(b.dataset.q ? cur + Number(b.dataset.q) : Number(b.dataset.set));
        };
        paint();
        setTimeout(() => el.amount.focus(), 280);
        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = parseMoney(el.amount.value);
          if (amount <= 0) { shake(el.amount); return toast('Digite um valor'); }
          const bal = potBalance(potId);
          if (d === 'out' && amount > bal) { shake(el.amount); return toast(`O pote só tem ${fmt(bal, { force: true })}`); }
          S.potMoves.push({ id: uid(), potId, accountId: el.acc.value, amount: d === 'in' ? amount : -amount, date: el.date.value || todayStr(), note: el.note.value.trim(), createdAt: Date.now() });
          save(); close(); render();
          if (!(d === 'in' && celebrateIfDone(potId, bal))) toast(d === 'in' ? `${fmt(amount, { force: true })} guardado em ${p.name} ${p.icon}` : `${fmt(amount, { force: true })} resgatado`);
        };
      },
    });
  }

  function distributeModal(preset = 0) {
    if (!S.pots.length) { toast('Crie um pote primeiro'); potModal(null); return; }
    const anySet = S.pots.some((p) => p.percent > 0);
    const perc = {};
    S.pots.forEach((p) => (perc[p.id] = anySet ? p.percent || 0 : Math.floor(100 / S.pots.length)));
    openModal({
      title: '⚡ Distribuir nos potes',
      body: `<form class="form" autocomplete="off" novalidate>
        <p class="muted small">Recebeu salário ou sobrou dinheiro? Divida entre seus potes de uma vez só.</p>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" value="${toInput(preset)}" aria-label="Valor a distribuir"></label>
        <label class="field"><span>Tirar dinheiro de</span><select name="acc">${accOptions(cashOrAll()[0].id, cashOrAll())}</select></label>
        <div>${S.pots.map((p) => `<div class="dist-row" style="--c:${p.color}">
          <span class="jar sm" style="--p:${p.goal ? potInfo(p).pct : 100}%">${p.icon}</span>
          <span class="dist-name">${esc(p.name)}<small>${fmt(potBalance(p.id), { force: true })}${p.goal ? ' de ' + fmt(p.goal, { force: true }) : ''}</small></span>
          <input class="input" type="number" min="0" max="100" inputmode="numeric" data-pid="${p.id}" value="${perc[p.id]}" aria-label="Porcentagem para ${esc(p.name)}"><span class="muted">%</span>
          <b class="dist-val" data-val="${p.id}"></b></div>`).join('')}</div>
        <div class="dist-total" id="dist-total"></div>
        <div class="row-btns"><button type="button" class="btn sm ghost" data-equal>Dividir igual</button></div>
        <label class="check"><input type="checkbox" name="remember" checked> Lembrar essas porcentagens</label>
        <button class="btn primary block" type="submit">Distribuir</button>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        const inputs = $$('[data-pid]', w);
        const calc = () => {
          const amount = parseMoney(el.amount.value);
          let tot = 0, used = 0;
          inputs.forEach((i) => {
            const pc = Math.max(0, Number(i.value) || 0);
            tot += pc;
            const v = Math.floor((amount * pc) / 100);
            used += v;
            $(`[data-val="${i.dataset.pid}"]`, w).textContent = fmt(v, { force: true });
          });
          const t = $('#dist-total', w);
          t.classList.toggle('bad', tot > 100);
          t.textContent = tot > 100 ? `Passou de 100% (${tot}%)` : `${tot}% distribuído${amount ? ` · ${fmt(amount - used, { force: true })} fica na conta` : ''}`;
          return { amount, tot };
        };
        f.addEventListener('input', calc);
        $('[data-equal]', w).onclick = () => { const v = Math.floor(100 / inputs.length); inputs.forEach((i) => (i.value = v)); calc(); };
        calc();
        if (!preset) setTimeout(() => el.amount.focus(), 280);
        f.onsubmit = (e) => {
          e.preventDefault();
          const { amount, tot } = calc();
          if (amount <= 0) { shake(el.amount); return toast('Digite um valor'); }
          if (tot <= 0 || tot > 100) return toast('As porcentagens devem somar entre 1% e 100%');
          let sum = 0, n = 0, celebrated = false;
          const now = Date.now();
          inputs.forEach((i, k) => {
            const pc = Math.max(0, Number(i.value) || 0);
            const pot = getPot(i.dataset.pid);
            if (el.remember.checked) pot.percent = pc;
            const v = Math.floor((amount * pc) / 100);
            if (v <= 0) return;
            const before = potBalance(pot.id);
            S.potMoves.push({ id: uid(), potId: pot.id, accountId: el.acc.value, amount: v, date: todayStr(), note: 'Distribuição', createdAt: now + k });
            celebrated = celebrateIfDone(pot.id, before) || celebrated;
            sum += v; n++;
          });
          save(); close(); render();
          if (!celebrated) toast(`${fmt(sum, { force: true })} distribuído em ${n} pote${n > 1 ? 's' : ''} ✨`);
        };
      },
    });
  }

  // ================= Planejamento =================
  function budgetModal() {
    const cats = S.categories.filter((c) => c.type === 'expense');
    const avg = avgByCat(3);
    openModal({
      title: '🎯 Orçamentos mensais',
      body: `<form class="form" autocomplete="off" novalidate>
        <p class="muted small">Quanto você quer gastar, no máximo, em cada categoria por mês? Deixe em branco para não limitar.</p>
        <div>${cats.map((c) => `<label class="dist-row"><span class="tx-ic" style="--c:${c.color}">${c.icon}</span>
          <span class="dist-name">${esc(c.name)}<small>${avg[c.id] ? `média: ${fmt(Math.round(avg[c.id]), { force: true })}/mês` : 'sem histórico'}</small></span>
          <input class="input" style="width:120px" inputmode="decimal" data-cid="${c.id}" placeholder="Sem limite" value="${toInput(c.budget)}"></label>`).join('')}</div>
        <button class="btn primary block" type="submit">Salvar orçamentos</button>
      </form>`,
      onMount(w, close) {
        $('form', w).onsubmit = (e) => {
          e.preventDefault();
          $$('[data-cid]', w).forEach((i) => { const c = getCat(i.dataset.cid); if (c.id) c.budget = Math.max(0, parseMoney(i.value)); });
          save(); close(); render(); toast('Orçamentos salvos');
        };
      },
    });
  }

  function billModal(bill) {
    const isEdit = !!bill;
    const d = bill || { name: '', amount: 0, day: new Date().getDate(), categoryId: 'contas', accountId: S.accounts[0].id, type: 'expense', auto: false };
    let type = d.type || 'expense';
    const catOpts = (tp, sel) => S.categories.filter((c) => c.type === tp).map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('');
    openModal({
      title: isEdit ? 'Editar fixo' : 'Novo fixo do mês',
      body: `<form class="form" autocomplete="off" novalidate>
        <div class="seg"><button type="button" data-k="expense">Conta a pagar</button><button type="button" data-k="income">Receita fixa</button></div>
        <label class="field"><span>Nome</span><input name="nome" value="${esc(d.name)}" placeholder="Ex: Aluguel, Internet, Salário" maxlength="40"></label>
        <div class="row2">
          <label class="field"><span>Valor (aprox.)</span><input name="amount" inputmode="decimal" placeholder="R$ 0,00" value="${toInput(d.amount)}"></label>
          <label class="field"><span id="day-l">Vence todo dia</span><input name="day" type="number" min="1" max="31" inputmode="numeric" value="${d.day}"></label>
        </div>
        <div class="row2">
          <label class="field"><span>Categoria</span><select name="cat">${catOpts(type, d.categoryId)}</select></label>
          <label class="field"><span id="acc-l2">Paga com</span><select name="acc">${accOptions(d.accountId)}</select></label>
        </div>
        <label class="check"><input type="checkbox" name="auto" ${d.auto ? 'checked' : ''}> Lançar sozinho no extrato quando chegar o dia</label>
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Adicionar'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        const paint = () => {
          $$('[data-k]', w).forEach((b) => b.classList.toggle('on', b.dataset.k === type));
          $('#day-l', w).textContent = type === 'income' ? 'Cai todo dia' : 'Vence todo dia';
          $('#acc-l2', w).textContent = type === 'income' ? 'Entra em' : 'Paga com';
          el.cat.innerHTML = catOpts(type, el.cat.value);
        };
        $$('[data-k]', w).forEach((b) => (b.onclick = () => { type = b.dataset.k; paint(); }));
        paint();
        if (!isEdit) setTimeout(() => el.nome.focus(), 280);
        if (isEdit) $('[data-del]', w).onclick = () => {
          close();
          const snap = snapshot();
          S.bills = S.bills.filter((b) => b.id !== bill.id);
          save(); render();
          toast('Conta fixa removida', { undo: () => restore(snap) });
        };
        f.onsubmit = (e) => {
          e.preventDefault();
          const name = el.nome.value.trim(), amount = parseMoney(el.amount.value), day = Math.min(31, Math.max(1, Number(el.day.value) || 1));
          if (!name) { shake(el.nome); return toast('Dê um nome à conta'); }
          if (amount <= 0) { shake(el.amount); return toast('Digite o valor'); }
          const data = { name, amount, day, type, auto: el.auto.checked, categoryId: el.cat.value, accountId: el.acc.value };
          if (isEdit) Object.assign(S.bills.find((b) => b.id === bill.id), data);
          else S.bills.push({ id: uid(), paid: {}, ...data });
          save(); close(); render(); toast(isEdit ? 'Fixo atualizado' : 'Fixo adicionado');
          runAutoRecurring();
        };
      },
    });
  }

  function payBill(id) {
    const b = S.bills.find((x) => x.id === id);
    if (!b) return;
    const ym = currentView() === 'planejar' ? UI.month : curMonth();
    if (isBillPaid(b, ym)) return;
    const date = ym === curMonth() ? todayStr() : dateInMonth(ym, b.day);
    const acc = S.accounts.some((a) => a.id === b.accountId) ? b.accountId : S.accounts[0].id;
    openModal({
      title: `${b.type === 'income' ? 'Receber' : 'Pagar'} ${esc(b.name)}`, size: 'small',
      body: `<form class="form" autocomplete="off" novalidate>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" value="${toInput(b.amount)}" aria-label="Valor pago"></label>
        <div class="row2">
          <label class="field"><span>${b.type === 'income' ? 'Entrou em' : 'Paga com'}</span><select name="acc">${accOptions(acc)}</select></label>
          <label class="field"><span>Data</span><input type="date" name="date" value="${date}"></label>
        </div>
        <button class="btn primary block" type="submit">Confirmar pagamento</button>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = parseMoney(el.amount.value);
          if (amount <= 0) { shake(el.amount); return toast('Digite o valor'); }
          const snap = snapshot();
          const tx = { id: uid(), type: b.type === 'income' ? 'income' : 'expense', amount, desc: b.name, categoryId: b.categoryId, accountId: el.acc.value, toAccountId: null, date: el.date.value || date, note: 'Fixo do mês', createdAt: Date.now() };
          S.transactions.push(tx);
          b.paid = b.paid || {};
          b.paid[ym] = tx.id;
          save(); close(); render();
          toast(`${b.name} ${b.type === 'income' ? 'recebido' : 'paga'} ✓`, { undo: () => restore(snap) });
        };
      },
    });
  }
  function unpayBill(id) {
    const b = S.bills.find((x) => x.id === id);
    if (!b || !b.paid) return;
    const ym = UI.month, txId = b.paid[ym];
    const snap = snapshot();
    S.transactions = S.transactions.filter((t) => t.id !== txId);
    if (b.auto) b.paid[ym] = 'pulado'; // impede o lançamento automático de recriar este mês
    else delete b.paid[ym];
    save(); render();
    toast('Pagamento desfeito', { undo: () => restore(snap) });
  }

  // ================= Contas e categorias =================
  function accModal(acc, kindPreset) {
    const isEdit = !!acc;
    const credit = kindPreset === 'credit';
    const d = acc || { name: '', icon: credit ? '💳' : '🏦', color: PALETTE[S.accounts.length % PALETTE.length], kind: credit ? 'credit' : 'checking', limit: 0, closeDay: 3, dueDay: 10 };
    let kind = d.kind || 'checking';
    const st = { icon: d.icon, color: d.color };
    const cur = isEdit ? accBalance(acc.id) : 0;
    openModal({
      title: isEdit ? (kind === 'credit' ? 'Editar cartão' : 'Editar conta') : 'Nova conta ou cartão',
      body: `<form class="form" autocomplete="off" novalidate>
        ${!isEdit ? '<div class="seg"><button type="button" data-k="checking">🏦 Conta ou carteira</button><button type="button" data-k="credit">💳 Cartão de crédito</button></div>' : ''}
        <label class="field"><span>Nome</span><input name="nome" value="${esc(d.name)}" placeholder="Ex: Nubank, Carteira, Poupança" maxlength="30"></label>
        <div class="field"><span>Ícone</span>${emojiPicker(ACC_EMOJIS, d.icon)}</div>
        <div class="field"><span>Cor</span>${swatchPicker(d.color)}</div>
        <div class="k-checking"><label class="field"><span>Saldo atual</span><input name="bal" inputmode="decimal" placeholder="R$ 0,00" value="${isEdit && kind !== 'credit' ? toInput(cur) || '0,00' : ''}">
          <small>${isEdit ? 'Se o saldo aqui estiver diferente do banco, corrija e salve. O ajuste é feito automaticamente.' : 'Quanto tem nessa conta agora.'}</small></label></div>
        <div class="k-credit form">
          <label class="field"><span>Limite do cartão</span><input name="limit" inputmode="decimal" placeholder="R$ 0,00" value="${toInput(d.limit)}"></label>
          <div class="row2">
            <label class="field"><span>Fecha todo dia</span><input name="closeDay" type="number" min="1" max="31" inputmode="numeric" value="${d.closeDay || 3}"></label>
            <label class="field"><span>Vence todo dia</span><input name="dueDay" type="number" min="1" max="31" inputmode="numeric" value="${d.dueDay || 10}"></label>
          </div>
          <label class="field"><span>Quanto você deve hoje nesse cartão</span><input name="debt" inputmode="decimal" placeholder="R$ 0,00" value="${isEdit && kind === 'credit' ? toInput(Math.max(0, -cur)) : ''}">
            <small>Some as faturas que ainda não pagou. Daqui pra frente, lance as compras escolhendo o cartão.</small></label>
        </div>
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Criar conta'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        bindPickers(w, st);
        const paint = () => {
          $$('[data-k]', w).forEach((b) => b.classList.toggle('on', b.dataset.k === kind));
          $('.k-checking', w).hidden = kind === 'credit';
          $('.k-credit', w).hidden = kind !== 'credit';
        };
        $$('[data-k]', w).forEach((b) => (b.onclick = () => { kind = b.dataset.k; paint(); }));
        paint();
        if (isEdit) $('[data-del]', w).onclick = () => {
          if (S.accounts.length === 1) return toast('Você precisa ter pelo menos uma conta');
          const used = S.transactions.some((t) => t.accountId === acc.id || t.toAccountId === acc.id) || S.potMoves.some((m) => m.accountId === acc.id);
          if (used) return toast('Essa conta tem lançamentos. Apague-os antes de excluir.');
          close();
          const snap = snapshot();
          S.accounts = S.accounts.filter((a) => a.id !== acc.id);
          save(); render(); toast('Conta excluída', { undo: () => restore(snap) });
        };
        f.onsubmit = (e) => {
          e.preventDefault();
          const name = el.nome.value.trim();
          if (!name) { shake(el.nome); return toast('Dê um nome à conta'); }
          const day = (v) => Math.min(31, Math.max(1, Number(v) || 1));
          const extra = kind === 'credit' ? { kind, limit: parseMoney(el.limit.value), closeDay: day(el.closeDay.value), dueDay: day(el.dueDay.value) } : { kind };
          // Cartão guarda a dívida como saldo negativo
          const bal = kind === 'credit' ? -parseMoney(el.debt.value) : parseMoney(el.bal.value);
          if (isEdit) {
            const a = S.accounts.find((x) => x.id === acc.id);
            Object.assign(a, { name, icon: st.icon, color: st.color, ...extra });
            a.initial = (a.initial || 0) + (bal - accBalance(a.id));
          } else S.accounts.push({ id: uid(), name, icon: st.icon, color: st.color, initial: bal, ...extra });
          save(); close(); render();
          toast(kind === 'credit' ? (isEdit ? 'Cartão atualizado' : 'Cartão criado 💳') : isEdit ? 'Conta atualizada' : 'Conta criada');
        };
      },
    });
  }

  function catModal(cat, type = 'expense') {
    const isEdit = !!cat;
    const d = cat || { name: '', icon: type === 'income' ? '💰' : '📦', color: PALETTE[S.categories.length % PALETTE.length], type, need: false, budget: 0 };
    const st = { icon: d.icon, color: d.color };
    openModal({
      title: isEdit ? 'Editar categoria' : `Nova categoria de ${d.type === 'income' ? 'receita' : 'despesa'}`,
      body: `<form class="form" autocomplete="off" novalidate>
        <label class="field"><span>Nome</span><input name="nome" value="${esc(d.name)}" placeholder="Ex: Academia" maxlength="24"></label>
        <div class="field"><span>Ícone</span>${emojiPicker(CAT_EMOJIS, d.icon)}<input name="custom" placeholder="…ou cole/digite outro emoji" maxlength="4"></div>
        <div class="field"><span>Cor</span>${swatchPicker(d.color)}</div>
        ${d.type === 'expense' ? `<label class="field"><span>Orçamento mensal (opcional)</span><input name="budget" inputmode="decimal" placeholder="Sem limite" value="${toInput(d.budget)}"></label>
        <label class="check"><input type="checkbox" name="need" ${d.need ? 'checked' : ''}> É um gasto essencial (necessidade)</label>` : ''}
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Criar'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        bindPickers(w, st);
        if (isEdit) $('[data-del]', w).onclick = () => {
          const n = S.transactions.filter((t) => t.categoryId === cat.id).length;
          close();
          confirmBox({
            title: 'Excluir categoria?', text: n ? `${n} lançamento${n > 1 ? 's' : ''} vão ficar “Sem categoria”.` : 'Essa categoria não tem lançamentos.', ok: 'Excluir', danger: true,
            onOk: () => {
              const snap = snapshot();
              S.categories = S.categories.filter((c) => c.id !== cat.id);
              S.transactions.forEach((t) => { if (t.categoryId === cat.id) t.categoryId = null; });
              save(); render(); toast('Categoria excluída', { undo: () => restore(snap) });
            },
          });
        };
        f.onsubmit = (e) => {
          e.preventDefault();
          const name = el.nome.value.trim();
          if (!name) { shake(el.nome); return toast('Dê um nome à categoria'); }
          const data = { name, icon: el.custom.value.trim() || st.icon, color: st.color };
          if (d.type === 'expense') { data.budget = parseMoney(el.budget.value); data.need = el.need.checked; }
          if (isEdit) Object.assign(S.categories.find((c) => c.id === cat.id), data);
          else S.categories.push({ id: uid(), type: d.type, need: false, budget: 0, ...data });
          save(); close(); render(); toast(isEdit ? 'Categoria atualizada' : 'Categoria criada');
        };
      },
    });
  }

  // ================= Backup =================
  function download(content, name, mime) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportJSON() {
    download(JSON.stringify({ ...S, exportedAt: new Date().toISOString() }, null, 2), `banco-do-murilo-backup-${todayStr()}.json`, 'application/json');
    toast('Backup exportado 📦');
  }
  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      file.text().then((txt) => {
        let data;
        try { data = JSON.parse(txt); } catch (e) { return toast('Arquivo inválido'); }
        if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.transactions)) return toast('Esse arquivo não parece um backup do Banco do Murilo');
        confirmBox({
          title: 'Importar backup?', text: `Isso vai <b>substituir</b> os dados atuais deste aparelho por ${data.transactions.length} lançamentos e ${(data.pots || []).length} potes do backup.`, ok: 'Importar',
          onOk: () => {
            const snap = snapshot();
            delete data.exportedAt;
            S = migrate(data);
            S.settings.onboarded = true;
            save(); applyTheme(); render();
            toast('Backup importado ✓', { undo: () => restore(snap) });
          },
        });
      });
    };
    input.click();
  }
  function exportCSV(items) {
    const money = (c) => (c / 100).toFixed(2).replace('.', ',');
    const rows = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Observação']];
    for (const it of items) {
      if (it.kind === 'tx') {
        const t = it.tx;
        const typeL = { expense: 'Despesa', income: 'Receita', transfer: 'Transferência' }[t.type];
        rows.push([shortDate(t.date), typeL, t.desc, t.type === 'transfer' ? '' : getCat(t.categoryId).name,
          t.type === 'transfer' ? `${getAcc(t.accountId).name} → ${getAcc(t.toAccountId).name}` : getAcc(t.accountId).name,
          money(t.type === 'expense' ? -t.amount : t.amount), t.note || '']);
      } else {
        const m = it.m;
        if (!m.accountId) rows.push([shortDate(m.date), 'Rendimento do pote', getPot(m.potId)?.name || '', '', '', money(m.amount), m.note || '']);
        else rows.push([shortDate(m.date), m.amount > 0 ? 'Guardado no pote' : 'Resgate do pote', getPot(m.potId)?.name || '', '', getAcc(m.accountId).name, money(-m.amount), m.note || '']);
      }
    }
    if (rows.length === 1) return toast('Nada para exportar');
    const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    download(csv, `extrato-${todayStr()}.csv`, 'text/csv;charset=utf-8');
    toast('Planilha exportada 📄');
  }
  function resetAll() {
    confirmBox({
      title: 'Apagar tudo?', text: 'Todos os lançamentos, potes, contas e configurações deste aparelho serão apagados. <b>Faça um backup antes</b> se quiser guardar algo.', ok: 'Apagar tudo', danger: true,
      onOk: () => {
        S = freshState();
        save(); applyTheme(); location.hash = '#inicio'; render(); onboarding();
      },
    });
  }

  // ================= Boas-vindas e dados de exemplo =================
  let onboardingOpen = false;
  function onboarding() {
    if (onboardingOpen) return;
    onboardingOpen = true;
    let done = false;
    openModal({
      title: 'Bem-vindo ao seu banco 👋',
      body: `<form class="form" autocomplete="off" novalidate>
        <p class="muted">Aqui você registra seus gastos, separa dinheiro em <b>potes</b> para seus objetivos e acompanha tudo mês a mês. Os dados ficam salvos neste aparelho.</p>
        <label class="field"><span>Como você se chama?</span><input name="nome" placeholder="Seu nome" maxlength="30"></label>
        <label class="field"><span>Nome da sua conta principal</span><input name="acc" placeholder="Ex: Nubank, Itaú, Conta corrente" maxlength="30"></label>
        <label class="field"><span>Quanto tem nela hoje?</span><input name="bal" inputmode="decimal" placeholder="R$ 0,00"></label>
        <button class="btn primary block" type="submit">Começar</button>
        <button class="btn ghost block" type="button" data-sample>👀 Só explorar com dados de exemplo</button>
      </form>`,
      onClose: () => { onboardingOpen = false; if (!done) { S.settings.onboarded = true; save(); } },
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        f.onsubmit = (e) => {
          e.preventDefault();
          done = true;
          S.settings.name = el.nome.value.trim();
          S.settings.onboarded = true;
          if (el.acc.value.trim()) S.accounts[0].name = el.acc.value.trim();
          S.accounts[0].initial = parseMoney(el.bal.value);
          save(); close(); render();
          toast('Tudo pronto! Registre seu primeiro gasto no +');
        };
        $('[data-sample]', w).onclick = () => {
          done = true;
          S = sampleData();
          save(); close(); render();
          toast('Dados de exemplo carregados. Apague em Ajustes quando quiser começar.');
        };
      },
    });
  }

  function sampleData() {
    const s = freshState();
    s.settings = { ...s.settings, name: 'Murilo', onboarded: true, theme: S.settings.theme };
    s.accounts = [
      { id: 'corrente', name: 'Conta corrente', icon: '🏦', color: '#0f9d6e', initial: 180000 },
      { id: 'carteira', name: 'Carteira', icon: '💵', color: '#f59e0b', initial: 35000 },
      { id: 'cartao', name: 'Cartão roxo', icon: '💳', color: '#8b5cf6', initial: 0, kind: 'credit', limit: 350000, closeDay: 3, dueDay: 10 },
    ];
    const rnd = (a, b) => Math.round((a + Math.random() * (b - a)) * 100);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let k = 0;
    const tx = (date, type, amount, desc, categoryId, accountId = 'corrente') => {
      const id = uid();
      s.transactions.push({ id, type, amount, desc, categoryId, accountId, toAccountId: null, date, note: '', createdAt: Date.now() - 1e7 + k++ });
      return id;
    };
    const bills = [
      { id: uid(), name: 'Salário', amount: 450000, day: 5, categoryId: 'salario', accountId: 'corrente', paid: {}, type: 'income', auto: true },
      { id: uid(), name: 'Aluguel', amount: 120000, day: 10, categoryId: 'moradia', accountId: 'corrente', paid: {} },
      { id: uid(), name: 'Internet', amount: 9990, day: 15, categoryId: 'contas', accountId: 'corrente', paid: {} },
      { id: uid(), name: 'Streaming', amount: 3990, day: 20, categoryId: 'assinaturas', accountId: 'corrente', paid: {} },
      { id: uid(), name: 'Conta de luz', amount: 18000, day: 28, categoryId: 'contas', accountId: 'corrente', paid: {} },
    ];
    s.bills = bills;
    s.pots = [
      { id: 'p1', name: 'Reserva de emergência', icon: '🛟', color: '#0f9d6e', goal: 1500000, deadline: '', percent: 50, rate: 0.85, createdAt: Date.now() },
      { id: 'p2', name: 'Viagem pra praia', icon: '🏖️', color: '#3b82f6', goal: 400000, deadline: dateInMonth(addMonths(curMonth(), 7), 15), percent: 30, createdAt: Date.now() },
      { id: 'p3', name: 'Celular novo', icon: '📱', color: '#8b5cf6', goal: 250000, deadline: dateInMonth(addMonths(curMonth(), 3), 1), percent: 20, createdAt: Date.now() },
    ];
    const cm = curMonth(), today = new Date().getDate();
    for (let m = 3; m >= 0; m--) {
      const ym = addMonths(cm, -m);
      const lim = m === 0 ? today : daysInMonth(ym);
      const at = (day) => (day <= lim ? dateInMonth(ym, day) : null);
      const add = (day, ...rest) => { const d = at(day); return d ? tx(d, ...rest) : null; };
      if (m === 1 || m === 3) add(18, 'income', rnd(300, 800), 'Freela', 'freela');
      bills.forEach((b) => { const id = add(b.day, b.type === 'income' ? 'income' : 'expense', b.name === 'Conta de luz' ? rnd(150, 230) : b.amount, b.name, b.categoryId); if (id) b.paid[ym] = id; });
      [3, 11, 19, 26].forEach((d) => add(d, 'expense', rnd(110, 260), 'Mercado', 'mercado'));
      for (let i = 0; i < 9; i++) add(1 + Math.floor(Math.random() * 28), 'expense', rnd(18, 62), pick(['iFood', 'Almoço', 'Padaria', 'Lanche', 'Café']), 'alimentacao', Math.random() < 0.15 ? 'carteira' : 'corrente');
      for (let i = 0; i < 5; i++) add(1 + Math.floor(Math.random() * 28), 'expense', rnd(12, 34), pick(['Uber', '99', 'Ônibus']), 'transporte');
      add(8 + m, 'expense', rnd(60, 120), pick(['Cinema', 'Barzinho', 'Show']), 'lazer', 'cartao');
      add(22, 'expense', rnd(40, 110), pick(['Barzinho', 'Jogo na Steam', 'Boliche']), 'lazer', 'cartao');
      add(13, 'expense', rnd(60, 180), pick(['Amazon', 'Shopee', 'Mercado Livre']), 'compras', 'cartao');
      add(2, 'expense', 3990, 'Netflix', 'assinaturas', 'cartao');
      if (m === 2) add(14, 'expense', 28990, 'Tênis', 'compras', 'cartao');
      if (m !== 1) add(16, 'expense', rnd(25, 70), 'Farmácia', 'saude');
      // depósitos nos potes
      const dep = at(6);
      if (dep) [['p1', 50000], ['p2', 30000], ['p3', m === 0 ? 40000 : 35000]].forEach(([p, v], i) => s.potMoves.push({ id: uid(), potId: p, accountId: 'corrente', amount: v, date: dep, note: 'Distribuição', createdAt: Date.now() - 1e6 + i }));
    }
    s.potMoves.push({ id: uid(), potId: 'p1', accountId: 'corrente', amount: 120000, date: dateInMonth(addMonths(cm, -3), 2), note: 'Saldo inicial', createdAt: Date.now() - 2e7 });
    // Paga as faturas do cartão que já venceram (precisa olhar os dados de exemplo como se fossem os atuais)
    const prevS = S;
    S = s;
    const card = s.accounts.find((a) => a.id === 'cartao');
    for (let m = 3; m >= 0; m--) {
      const ym = addMonths(cm, -m), due = dateInMonth(ym, card.dueDay);
      if (due > todayStr()) continue;
      const total = invoiceTotal(card, cycleFor(card, dateInMonth(ym, card.closeDay)));
      if (total > 0) s.transactions.push({ id: uid(), type: 'transfer', amount: total, desc: 'Fatura Cartão roxo', categoryId: null, accountId: 'corrente', toAccountId: 'cartao', date: due, note: '', createdAt: Date.now() - 5e6 + m });
    }
    S = prevS;
    const daysAgo = (n) => shiftDay(todayStr(), -n);
    s.debts = [
      { id: uid(), person: 'João', type: 'owed', amount: 15000, desc: 'Ingresso do show', date: daysAgo(12), due: daysAgo(-2), payments: [], createdAt: Date.now() },
      { id: uid(), person: 'Ana', type: 'owe', amount: 9000, desc: 'Pizza de sexta', date: daysAgo(5), due: '', payments: [{ id: uid(), amount: 4500, date: daysAgo(2), txId: null, createdAt: Date.now() }], createdAt: Date.now() },
    ];
    [1, 2].forEach((k) => s.potMoves.push({ id: uid(), potId: 'p1', accountId: null, amount: 1800 + k * 70, date: dateInMonth(addMonths(cm, -k), 28), note: 'Rendimento', createdAt: Date.now() - 3e6 + k }));
    const budgets = { alimentacao: 45000, mercado: 90000, transporte: 20000, lazer: 25000, compras: 30000 };
    s.categories.forEach((c) => { if (budgets[c.id]) c.budget = budgets[c.id]; });
    return s;
  }

  // ================= Cartões de crédito =================
  function cardsHome() {
    const cs = cards();
    if (!cs.length) return '';
    return `<section class="card"><div class="card-head"><h3>Cartões de crédito</h3><a class="link" href="#cartoes">Ver faturas</a></div>
      <div class="tx-list">${cs.map((c) => {
        const inf = cardInfo(c), st = invoiceStatus(inf.closed);
        const sub = inf.closed.remaining > 0 ? `Fechada: ${fmt(inf.closed.remaining)} · <span class="status ${st.key}">${st.label}</span>` : `Fatura atual · fecha ${ddmm(inf.open.end)}`;
        return `<button class="tx" data-action="card-invoice" data-id="${c.id}"><span class="tx-ic" style="--c:${c.color}">${c.icon}</span>
          <span class="tx-main"><b>${esc(c.name)}</b><small>${sub}</small></span><span class="tx-amt">${fmt(inf.open.total)}</span></button>`;
      }).join('')}</div></section>`;
  }

  function viewCartoes() {
    const cs = cards();
    if (!cs.length) {
      return `<div class="page"><section class="card">${emptyBox('💳', 'Nenhum cartão de crédito', 'Cadastre seu cartão para acompanhar a fatura, o limite e não perder o vencimento. As compras caem na fatura certa sozinhas, inclusive as parceladas.', '<br><button class="btn primary" data-action="acc-new" data-kind="credit">Adicionar cartão</button>')}</section></div>`;
    }
    return `<div class="page">
      <div class="toolbar"><span class="muted small">Toque no cartão para ver as compras da fatura.</span><button class="btn sm soft" data-action="acc-new" data-kind="credit">${ICON.plus} Novo cartão</button></div>
      <div class="cards-grid">${cs.map((c) => {
        const inf = cardInfo(c), st = invoiceStatus(inf.closed);
        const usedPct = c.limit ? Math.min(100, Math.max(0, (inf.used / c.limit) * 100)) : 0;
        return `<article class="card cc-wrap">
          <button class="ccard" style="--c:${c.color}" data-action="card-invoice" data-id="${c.id}">
            <span class="cc-top"><span>${c.icon} ${esc(c.name)}</span><span class="cc-chip"></span></span>
            <span class="cc-label">Fatura atual${inf.open.total > 0 && inf.open.remaining <= 0 ? ' · já paga ✓' : ''}</span>
            <span class="cc-val">${fmt(inf.open.total)}</span>
            <span class="cc-foot"><span>Fecha ${ddmm(inf.open.end)}</span><span>Vence ${ddmm(inf.open.due)}</span></span>
          </button>
          ${c.limit ? `<div class="cc-limit"><div class="budget-top"><span>Limite usado</span><small>${fmt(inf.used)} de ${fmt(c.limit)}</small></div>
            <div class="bar ${usedPct >= 90 ? 'over' : usedPct >= 70 ? 'warn' : ''}"><i style="width:${usedPct}%;--c:${c.color}"></i></div>
            <div class="budget-left">Disponível: ${fmt(inf.available)}${inf.future ? ` · ${fmt(inf.future)} em parcelas futuras` : ''}</div></div>` : ''}
          ${inf.closed.total > 0 ? `<div class="cc-closed"><div><small>Fatura de ${monthName(inf.closed.due.slice(0, 7)).toLowerCase()} (fechada)</small><b>${fmt(inf.closed.total)}</b> <span class="status ${st.key}">${st.label}</span></div>
            ${inf.closed.remaining > 0 ? `<button class="btn sm primary" data-action="card-pay" data-id="${c.id}">Pagar</button>` : ''}</div>` : ''}
          <div class="row-btns"><button class="btn sm ghost" data-action="card-invoice" data-id="${c.id}">Ver fatura</button>${inf.closed.remaining <= 0 ? `<button class="btn sm ghost" data-action="card-pay" data-id="${c.id}">Pagar fatura</button>` : ''}<button class="btn sm ghost" data-action="acc-edit" data-id="${c.id}">Editar</button></div>
        </article>`;
      }).join('')}</div>
    </div>`;
  }

  function invoiceModal(cardId, offset = 0) {
    const c = S.accounts.find((a) => a.id === cardId);
    if (!c) return;
    const open = cycleFor(c, todayStr());
    const cyc = cycleFor(c, dateInMonth(addMonths(open.end.slice(0, 7), offset), c.closeDay));
    const total = invoiceTotal(c, cyc), list = invoiceTx(c, cyc);
    const label = offset === 0 ? 'Fatura aberta' : offset < 0 ? 'Fatura fechada' : 'Fatura futura';
    openModal({
      title: `${c.icon} ${esc(c.name)}`,
      body: `<div class="month-nav"><button type="button" data-inv="${offset - 1}" aria-label="Fatura anterior">${ICON.chevL}</button><span class="month-label">Vence ${shortDate(cyc.due)}</span><button type="button" data-inv="${offset + 1}" aria-label="Próxima fatura">${ICON.chevR}</button></div>
        <div class="inv-sum"><small>${label} · compras de ${ddmm(cyc.start)} a ${ddmm(cyc.end)}</small><b>${fmt(total)}</b></div>
        ${list.length ? `<div class="tx-list">${list.map(txRow).join('')}</div>` : '<p class="muted small" style="padding:12px 2px;text-align:center">Nenhuma compra nesta fatura.</p>'}
        <div class="modal-actions" style="margin-top:12px"><button class="btn primary" data-action="card-pay" data-id="${c.id}">Pagar fatura</button></div>`,
      onMount(w, close) {
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-inv]');
          if (!b) return;
          close();
          invoiceModal(cardId, Number(b.dataset.inv));
        });
      },
    });
  }

  function payCardModal(cardId) {
    const c = S.accounts.find((a) => a.id === cardId);
    if (!c) return;
    const cash = cashAccounts();
    if (!cash.length) return toast('Cadastre uma conta para pagar a fatura');
    const inf = cardInfo(c);
    const suggested = inf.closed.remaining || inf.open.remaining || inf.debt;
    openModal({
      title: `Pagar fatura · ${esc(c.name)}`, size: 'small',
      body: `<form class="form" autocomplete="off" novalidate>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" value="${toInput(suggested)}" aria-label="Valor do pagamento"></label>
        <div class="quick-amts">${inf.closed.remaining ? `<button type="button" class="chip" data-set="${inf.closed.remaining}">Fatura fechada</button>` : ''}${inf.debt ? `<button type="button" class="chip" data-set="${inf.debt}">Tudo que devo</button>` : ''}</div>
        <div class="row2">
          <label class="field"><span>Pagar com</span><select name="acc">${accOptions(cash[0].id, cash)}</select></label>
          <label class="field"><span>Data</span><input type="date" name="date" value="${todayStr()}"></label>
        </div>
        <button class="btn primary block" type="submit">Confirmar pagamento</button></form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        $('.quick-amts', w).onclick = (e) => { const b = e.target.closest('[data-set]'); if (b) el.amount.value = toInput(Number(b.dataset.set)); };
        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = evalMoney(el.amount.value);
          if (amount <= 0) { shake(el.amount); return toast('Digite um valor'); }
          S.transactions.push({ id: uid(), type: 'transfer', amount, desc: `Fatura ${c.name}`, categoryId: null, accountId: el.acc.value, toAccountId: c.id, date: el.date.value || todayStr(), note: '', createdAt: Date.now() });
          save(); close(); render(); toast('Fatura paga ✓');
        };
      },
    });
  }

  function forecastModal() {
    const fc = forecast(), t = todayStr();
    let run = fc.now;
    openModal({
      title: '📅 Previsão do mês',
      body: `<p class="muted small">Quanto deve sobrar nas suas contas até ${shortDate(fc.endDate)}, contando o que já está combinado.</p>
        <div class="fc-row fc-now"><span>Saldo hoje</span><b>${fmt(fc.now)}</b></div>
        ${fc.items.length ? fc.items.map((i) => {
          run += i.amount;
          return `<div class="fc-row"><span class="fc-ic">${i.icon}</span><span class="fc-main"><b>${esc(i.label)}</b><small>${ddmm(i.date)} · ${i.tag}${i.date < t ? ' · atrasado' : ''}</small></span>
            <span class="fc-amt"><b class="${i.amount > 0 ? 'pos-t' : ''}">${fmt(i.amount, { sign: true })}</b><small>${fmt(run)}</small></span></div>`;
        }).join('') : '<p class="muted small" style="padding:10px 0">Nenhum fixo, fatura ou parcela pendente até o fim do mês.</p>'}
        <div class="fc-row fc-end"><span>Previsão no fim do mês</span><b class="${fc.end < 0 ? 'neg-t' : ''}">${fmt(fc.end)}</b></div>
        ${fc.end < 0 ? '<div class="verdict">⚠️ Com as contas pendentes, o saldo fica negativo. Dá para resgatar de um pote ou adiar algum gasto.</div>' : ''}
        <p class="muted small" style="margin-top:10px">Entram os fixos ainda não marcados, lançamentos agendados e faturas que vencem este mês. Gastos do dia a dia ainda não registrados não entram.</p>`,
    });
  }

  // ================= Dívidas e empréstimos =================
  function viewDividas() {
    const open = S.debts.filter((d) => debtRemaining(d) > 0), done = S.debts.filter((d) => debtRemaining(d) <= 0);
    const owed = open.filter((d) => d.type === 'owed').reduce((s, d) => s + debtRemaining(d), 0);
    const owe = open.filter((d) => d.type === 'owe').reduce((s, d) => s + debtRemaining(d), 0);
    const list = (UI.debtTab === 'open' ? open : done).sort((a, b) => ((a.due || a.date) < (b.due || b.date) ? -1 : 1));
    return `<div class="page">
      <div class="stats two">
        <div class="stat"><small><i class="dot pos"></i>Me devem</small><b class="pos-t">${fmt(owed)}</b></div>
        <div class="stat"><small><i class="dot neg"></i>Eu devo</small><b class="neg-t">${fmt(owe)}</b></div>
      </div>
      <div class="toolbar">
        <div class="chips"><button class="chip ${UI.debtTab === 'open' ? 'on' : ''}" data-action="debt-tab" data-v="open">Em aberto (${open.length})</button><button class="chip ${UI.debtTab === 'done' ? 'on' : ''}" data-action="debt-tab" data-v="done">Quitadas (${done.length})</button></div>
        <button class="btn sm primary" data-action="debt-new">${ICON.plus} Anotar</button>
      </div>
      <section class="card">${list.length ? `<div class="tx-list">${list.map(debtRow).join('')}</div>`
        : UI.debtTab === 'open'
          ? emptyBox('🤝', 'Nada pendente', 'Anote quando emprestar dinheiro, dividir uma conta ou pegar algo emprestado. Assim ninguém esquece.', '<br><button class="btn primary" data-action="debt-new">Anotar agora</button>')
          : emptyBox('✅', 'Nada quitado ainda', 'O que for sendo pago aparece aqui.')}</section>
    </div>`;
  }
  function debtRow(d) {
    const rem = debtRemaining(d), paid = debtPaid(d), owed = d.type === 'owed';
    const late = d.due && rem > 0 && d.due < todayStr();
    const when = d.due ? (late ? ` · <span class="neg-t">passou de ${ddmm(d.due)}</span>` : ` · até ${ddmm(d.due)}`) : '';
    return `<button class="tx" data-action="debt-detail" data-id="${d.id}">
      <span class="avatar" style="--c:${personColor(d.person)}">${esc(d.person.trim().charAt(0).toUpperCase())}</span>
      <span class="tx-main"><b>${esc(d.person)}</b><small>${esc(d.desc || (owed ? 'Te deve' : 'Você deve'))} · ${ddmm(d.date)}${when}</small>
        ${paid > 0 && rem > 0 ? `<span class="bar thin"><i style="width:${(paid / d.amount) * 100}%;--c:${owed ? 'var(--pos)' : 'var(--neg)'}"></i></span>` : ''}</span>
      <span class="tx-amt ${rem <= 0 ? 'neutral' : owed ? 'pos' : 'neg'}">${fmt(rem > 0 ? rem : d.amount)}<small>${rem > 0 ? (owed ? 'te deve' : 'você deve') : 'quitado ✓'}</small></span>
    </button>`;
  }
  function debtModal(debt) {
    const isEdit = !!debt;
    const d = debt || { person: '', type: 'owed', amount: 0, desc: '', date: todayStr(), due: '' };
    let type = d.type;
    const people = [...new Set(S.debts.map((x) => x.person))];
    openModal({
      title: isEdit ? 'Editar anotação' : 'Nova anotação',
      body: `<form class="form" autocomplete="off" novalidate>
        <div class="seg"><button type="button" data-k="owed">💚 Me devem</button><button type="button" data-k="owe">🔴 Eu devo</button></div>
        <label class="field"><span>Pessoa</span><input name="person" list="people-list" value="${esc(d.person)}" placeholder="Ex: João" maxlength="40"></label>
        <datalist id="people-list">${people.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        <div class="row2">
          <label class="field"><span>Valor</span><input name="amount" inputmode="decimal" placeholder="R$ 0,00" value="${toInput(d.amount)}"></label>
          <label class="field"><span>Data</span><input type="date" name="date" value="${d.date}"></label>
        </div>
        <label class="field"><span>Do que se trata?</span><input name="desc" value="${esc(d.desc)}" placeholder="Ex: Ingresso do show, empréstimo" maxlength="60"></label>
        <label class="field"><span>Combinado para (opcional)</span><input type="date" name="due" value="${d.due || ''}"><small>Perto da data aparece um aviso na tela inicial.</small></label>
        <div class="modal-actions">${isEdit ? '<button type="button" class="btn danger-ghost" data-del>Excluir</button>' : ''}<button class="btn primary" type="submit">${isEdit ? 'Salvar' : 'Anotar'}</button></div>
      </form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        const paint = () => $$('[data-k]', w).forEach((b) => b.classList.toggle('on', b.dataset.k === type));
        $$('[data-k]', w).forEach((b) => (b.onclick = () => { type = b.dataset.k; paint(); }));
        paint();
        if (!isEdit) setTimeout(() => el.person.focus(), 280);
        if (isEdit) $('[data-del]', w).onclick = () => {
          close();
          const snap = snapshot();
          S.debts = S.debts.filter((x) => x.id !== debt.id);
          save(); render(); toast('Anotação excluída', { undo: () => restore(snap) });
        };
        f.onsubmit = (e) => {
          e.preventDefault();
          const person = el.person.value.trim(), amount = evalMoney(el.amount.value);
          if (!person) { shake(el.person); return toast('Diga quem é a pessoa'); }
          if (amount <= 0) { shake(el.amount); return toast('Digite o valor'); }
          const data = { person, type, amount, desc: el.desc.value.trim(), date: el.date.value || todayStr(), due: el.due.value || '' };
          if (isEdit) Object.assign(S.debts.find((x) => x.id === debt.id), data);
          else S.debts.push({ id: uid(), payments: [], createdAt: Date.now(), ...data });
          save(); close(); render(); toast(isEdit ? 'Anotação atualizada' : 'Anotado 📝');
        };
      },
    });
  }
  function debtDetail(id) {
    const d = S.debts.find((x) => x.id === id);
    if (!d) return;
    const rem = debtRemaining(d), owed = d.type === 'owed', color = personColor(d.person);
    openModal({
      title: esc(d.person),
      body: `<div class="pot-detail">
          <span class="avatar big" style="--c:${color}">${esc(d.person.trim().charAt(0).toUpperCase())}</span>
          <div class="pd-value ${rem > 0 ? (owed ? 'pos-t' : 'neg-t') : ''}">${fmt(rem > 0 ? rem : d.amount)}</div>
          <div class="muted">${rem > 0 ? `${owed ? 'ainda te deve' : 'você ainda deve'} · total ${fmt(d.amount)}` : 'Quitado ✓'}</div>
          <div class="bar"><i style="width:${Math.min(100, (debtPaid(d) / d.amount) * 100)}%;--c:${owed ? 'var(--pos)' : 'var(--neg)'}"></i></div>
          <div class="pd-hint">${esc(d.desc || '')}${d.due ? ` · combinado para ${shortDate(d.due)}` : ''}</div>
        </div>
        ${rem > 0 ? `<button class="btn primary block" data-action="debt-pay" data-id="${d.id}">${owed ? 'Recebi um pagamento' : 'Fiz um pagamento'}</button>` : ''}
        <h4 class="section-title">Pagamentos</h4>
        <div>${(d.payments || []).length ? [...d.payments].sort(byDateDesc).map((p) => `<div class="move">
            <span class="m-ic ${owed ? 'in' : 'out'}">${owed ? '↓' : '↑'}</span>
            <div><b>${fmt(p.amount)}</b><small>${dateLabel(p.date)}${p.txId ? ' · lançado no extrato' : ''}</small></div>
            <button class="x" data-pay-del="${p.id}" aria-label="Apagar pagamento">${ICON.x}</button></div>`).join('') : '<p class="muted small" style="padding:8px 2px">Nenhum pagamento ainda.</p>'}</div>
        <div class="modal-actions" style="margin-top:16px"><button class="btn ghost" data-action="debt-edit" data-id="${d.id}">Editar</button></div>`,
      onMount(w, close) {
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-pay-del]');
          if (!b) return;
          const snap = snapshot();
          const cur = S.debts.find((x) => x.id === id);
          const p = cur && cur.payments.find((x) => x.id === b.dataset.payDel);
          if (!p) return;
          cur.payments = cur.payments.filter((x) => x !== p);
          if (p.txId) S.transactions = S.transactions.filter((t) => t.id !== p.txId);
          save(); close(); render(); debtDetail(id);
          toast('Pagamento apagado', { undo: () => restore(snap) });
        });
      },
    });
  }
  function debtPayModal(id) {
    const d = S.debts.find((x) => x.id === id);
    if (!d) return;
    const owed = d.type === 'owed', list = cashOrAll();
    openModal({
      title: owed ? `Recebi de ${esc(d.person)}` : `Paguei ${esc(d.person)}`, size: 'small',
      body: `<form class="form" autocomplete="off" novalidate>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" value="${toInput(debtRemaining(d))}" aria-label="Valor"></label>
        <div class="row2">
          <label class="field"><span>${owed ? 'Entrou em' : 'Saiu de'}</span><select name="acc">${accOptions(list[0].id, list)}</select></label>
          <label class="field"><span>Data</span><input type="date" name="date" value="${todayStr()}"></label>
        </div>
        <label class="check"><input type="checkbox" name="launch" checked> Lançar no extrato (${owed ? 'como receita' : 'como despesa'})</label>
        <button class="btn primary block" type="submit">Confirmar</button></form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = evalMoney(el.amount.value);
          if (amount <= 0) { shake(el.amount); return toast('Digite o valor'); }
          const date = el.date.value || todayStr();
          let txId = null;
          if (el.launch.checked) {
            txId = uid();
            S.transactions.push({ id: txId, type: owed ? 'income' : 'expense', amount, desc: `${d.person}${d.desc ? ' · ' + d.desc : ''}`, categoryId: fallbackCat(owed ? 'income' : 'expense'), accountId: el.acc.value, toAccountId: null, date, note: owed ? 'Pagamento recebido' : 'Pagamento de dívida', createdAt: Date.now() });
          }
          d.payments = d.payments || [];
          d.payments.push({ id: uid(), amount, date, txId, createdAt: Date.now() });
          const settled = debtRemaining(d) <= 0;
          save(); close(); render();
          toast(settled ? 'Quitado! 🎉' : 'Pagamento registrado');
          if (settled) confetti();
        };
      },
    });
  }

  // ================= Relatórios =================
  function lineSvg(pts) {
    const W = 560, H = 190, l = 12, r = 12, top = 24, bottom = 24, ch = H - top - bottom, cw = W - l - r;
    let min = Math.min(...pts.map((p) => p.v)), max = Math.max(...pts.map((p) => p.v));
    if (min === max) { min -= 10000; max += 10000; }
    const padv = (max - min) * 0.12;
    min -= padv; max += padv;
    const x = (i) => l + (pts.length === 1 ? cw / 2 : (i * cw) / (pts.length - 1));
    const y = (v) => top + ch - ((v - min) / (max - min)) * ch;
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const li = pts.length - 1;
    let s = `<svg class="line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do patrimônio">`;
    for (let i = 0; i <= 2; i++) { const gy = top + (ch * i) / 2; s += `<line x1="${l}" x2="${W - r}" y1="${gy}" y2="${gy}" stroke="var(--line)" stroke-dasharray="3 4"/>`; }
    s += `<path d="${line}L${x(li).toFixed(1)},${top + ch}L${x(0).toFixed(1)},${top + ch}Z" fill="var(--accent)" opacity=".12"/>`;
    s += `<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => {
      s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === li ? 5 : 3}" fill="${i === li ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--accent)" stroke-width="2"><title>${p.label}: ${fmt(p.v)}</title></circle>`;
      s += `<text x="${x(i)}" y="${H - 6}" class="${p.cur ? 'cur' : ''}">${p.label}</text>`;
    });
    const lx = x(li), anchor = lx > W - 90 ? 'end' : lx < 90 ? 'start' : 'middle';
    s += `<text x="${lx}" y="${Math.max(14, y(pts[li].v) - 11)}" class="val" text-anchor="${anchor}">${fmtShort(pts[li].v)}</text>`;
    return s + '</svg>';
  }
  function viewRelatorios() {
    const y = UI.year, ys = String(y), t = todayStr(), cm = curMonth();
    const months = Array.from({ length: 12 }, (_, i) => `${y}-${pad(i + 1)}`);
    const stats = months.map((m) => ({ ym: m, ...monthStats(m) }));
    const inc = stats.reduce((s, m) => s + m.inc, 0), exp = stats.reduce((s, m) => s + m.exp, 0);
    const active = stats.filter((m) => m.ym <= cm && (m.inc || m.exp)).length || 1;
    const saved = S.potMoves.filter((m) => m.accountId && m.date.startsWith(ys)).reduce((s, m) => s + m.amount, 0);
    const yields = S.potMoves.filter((m) => !m.accountId && m.date.startsWith(ys)).reduce((s, m) => s + m.amount, 0);
    const rate = inc ? Math.round(((inc - exp) / inc) * 100) : 0;
    const yearNav = `<div class="month-nav"><button data-action="year-prev" aria-label="Ano anterior">${ICON.chevL}</button><button class="month-label" data-action="year-today">${y}${y === new Date().getFullYear() ? '<em>atual</em>' : ''}</button><button data-action="year-next" aria-label="Próximo ano">${ICON.chevR}</button></div>`;
    if (!inc && !exp) return `<div class="page">${yearNav}<section class="card">${emptyBox('📊', `Sem lançamentos em ${y}`, 'Os relatórios aparecem conforme você registra seus gastos e receitas.')}</section></div>`;

    const pts = months.filter((m) => `${m}-01` <= t).map((m) => { const end = dateInMonth(m, 31); return { label: monthShort(m), v: netWorthAt(end < t ? end : t), cur: m === cm }; });
    const byCat = {}, prevCat = {}, wk = [0, 0, 0, 0, 0, 0, 0];
    for (const tx of S.transactions) {
      if (tx.type !== 'expense') continue;
      if (tx.date.startsWith(ys)) { byCat[tx.categoryId] = (byCat[tx.categoryId] || 0) + tx.amount; wk[parseDate(tx.date).getDay()] += tx.amount; }
      else if (tx.date.startsWith(String(y - 1))) prevCat[tx.categoryId] = (prevCat[tx.categoryId] || 0) + tx.amount;
    }
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const top = S.transactions.filter((x) => x.type === 'expense' && x.date.startsWith(ys)).sort((a, b) => b.amount - a.amount).slice(0, 6);
    const maxWk = Math.max(1, ...wk), topWk = wk.indexOf(Math.max(...wk));
    return `<div class="page">
      ${yearNav}
      <div class="kpis">
        <div class="stat"><small>Entradas no ano</small><b class="pos-t">${fmt(inc)}</b></div>
        <div class="stat"><small>Saídas no ano</small><b>${fmt(exp)}</b></div>
        <div class="stat"><small>Gasto médio por mês</small><b>${fmt(Math.round(exp / active))}</b></div>
        <div class="stat"><small>Taxa de economia</small><b class="${rate >= 0 ? 'pos-t' : 'neg-t'}">${rate}%</b></div>
      </div>
      <div class="grid2">
        <section class="card"><div class="card-head"><h3>Evolução do patrimônio</h3><small>contas + potes − cartões</small></div>${pts.length ? lineSvg(pts) : ''}</section>
        <section class="card"><div class="card-head"><h3>Entradas e saídas</h3><small>toque num mês para ver o extrato</small></div>
          ${barsSvg(stats.map((s) => ({ ym: s.ym, inc: s.inc, exp: s.exp })), cm, 560)}
          <div class="chart-key"><span><i style="background:var(--pos)"></i>Entradas</span><span><i style="background:var(--neg)"></i>Saídas</span></div></section>
      </div>
      <section class="card"><div class="card-head"><h3>Para onde foi o dinheiro</h3><small>${prevCat && Object.keys(prevCat).length ? `comparado com ${y - 1}` : ''}</small></div>
        <div class="rep-table">${cats.map(([id, v]) => {
          const c = getCat(id), p = prevCat[id], diff = p ? Math.round(((v - p) / p) * 100) : null;
          return `<div class="rep-row"><span class="tx-ic" style="--c:${c.color}">${c.icon}</span>
            <span class="rep-main"><b>${esc(c.name)}</b><span class="bar thin"><i style="width:${(v / cats[0][1]) * 100}%;--c:${c.color}"></i></span></span>
            <span class="rep-val"><b>${fmt(v)}</b><small>${Math.round((v / exp) * 100)}% · ${fmtShort(Math.round(v / active))}/mês${diff !== null ? ` · <span class="${diff > 0 ? 'neg-t' : 'pos-t'}">${diff > 0 ? '▲' : '▼'}${Math.abs(diff)}%</span>` : ''}</small></span></div>`;
        }).join('')}</div></section>
      <div class="grid2">
        <section class="card"><div class="card-head"><h3>Maiores gastos</h3></div><div class="tx-list">${top.map(txRow).join('')}</div></section>
        <section class="card"><div class="card-head"><h3>Gastos por dia da semana</h3></div>
          <div class="wk">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<div class="wk-row"><span>${WEEK_FULL[i].slice(0, 3)}</span><span class="bar thin"><i style="width:${(wk[i] / maxWk) * 100}%"></i></span><b>${fmtShort(wk[i])}</b></div>`).join('')}</div>
          <div class="verdict">${wk[topWk] ? `📆 Você gasta mais às <b>${WEEK_FULL[topWk].toLowerCase()}s</b>. ` : ''}🫙 Guardado nos potes em ${y}: <b>${fmt(saved)}</b>${yields ? ` · rendeu <b>${fmt(yields)}</b>` : ''}</div></section>
      </div>
    </div>`;
  }

  // ================= Calendário de gastos =================
  function calendarHtml(ym) {
    const dim = daysInMonth(ym), first = parseDate(`${ym}-01`).getDay(), t = todayStr(), cm = curMonth();
    const out = {}, inn = {};
    for (const tx of S.transactions) {
      if (!tx.date.startsWith(ym)) continue;
      const d = Number(tx.date.slice(8));
      if (tx.type === 'expense') out[d] = (out[d] || 0) + tx.amount;
      else if (tx.type === 'income') inn[d] = (inn[d] || 0) + tx.amount;
    }
    const vals = Object.values(out), max = Math.max(1, ...vals), total = vals.reduce((s, v) => s + v, 0);
    const passed = ym < cm ? dim : ym === cm ? new Date().getDate() : 0;
    let zeroDays = 0;
    for (let d = 1; d <= passed; d++) if (!out[d]) zeroDays++;
    let cells = WEEK.map((w) => `<span class="cal-wd">${w}</span>`).join('');
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let d = 1; d <= dim; d++) {
      const date = `${ym}-${pad(d)}`, v = out[d] || 0, lv = v ? Math.min(4, Math.ceil((v / max) * 4)) : 0;
      cells += `<button class="cal-day lv${lv} ${date === t ? 'today' : ''} ${date > t ? 'fut' : ''}" data-action="cal-day" data-d="${date}" aria-label="Dia ${d}: ${v ? fmt(v, { force: true }) + ' em gastos' : 'sem gastos'}">
        <b>${d}</b>${v ? `<small>${compact(v)}</small>` : inn[d] ? '<small class="pos-t">+</small>' : ''}</button>`;
    }
    return `<div class="cal">${cells}</div>
      <div class="cal-legend"><span>Menos</span>${[0, 1, 2, 3, 4].map((l) => `<i class="lv${l}"></i>`).join('')}<span>Mais</span></div>
      <div class="list-summary" style="margin-top:12px"><span>Gasto no mês <b>${fmt(total)}</b></span>${zeroDays ? `<span>🌱 <b>${zeroDays}</b> dia${zeroDays > 1 ? 's' : ''} sem gastar</span>` : ''}${vals.length ? `<span>Média nos dias com gasto <b>${fmt(Math.round(total / vals.length))}</b></span>` : ''}</div>
      <p class="muted small" style="margin-top:6px">Toque num dia para ver os lançamentos dele.</p>`;
  }

  // ================= Importar extrato do banco (OFX / CSV) =================
  async function readFileText(file) {
    const buf = await file.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1252').decode(buf); }
  }
  // Bancos costumam mandar tudo em MAIÚSCULAS; deixa mais legível
  function prettyDesc(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s === s.toUpperCase() && /[A-Z]/.test(s) ? s.toLowerCase().replace(/(^|[\s\-/*])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s;
  }
  function parseOFX(txt) {
    const out = [];
    for (const block of txt.split(/<STMTTRN>/i).slice(1)) {
      const tag = (n) => { const m = block.match(new RegExp(`<${n}>([^<\\r\\n]*)`, 'i')); return m ? m[1].trim() : ''; };
      const amount = Math.round(parseFloat(tag('TRNAMT').replace(',', '.')) * 100);
      const dt = tag('DTPOSTED');
      const date = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
      if (!isNaN(amount) && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.push({ date, desc: prettyDesc(tag('MEMO') || tag('NAME')), amount, extId: tag('FITID') });
    }
    return out;
  }
  function parseDateAny(s) {
    s = String(s || '').trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${pad(m[2])}-${pad(m[1])}`;
    return null;
  }
  function parseCSV(txt) {
    const lines = txt.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const delim = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    const split = (line) => {
      const res = [];
      let cur = '', q = false;
      for (const ch of line) {
        if (ch === '"') q = !q;
        else if (ch === delim && !q) { res.push(cur); cur = ''; } else cur += ch;
      }
      res.push(cur);
      return res.map((x) => x.trim());
    };
    const head = split(lines[0]).map(norm);
    const find = (re) => head.findIndex((h) => re.test(h));
    const di = find(/^data|^date/), vi = find(/valor|amount|quantia|montante/);
    const ti = find(/descri|title|titulo|histori|memo|lancamento|estabelecimento/), ii = find(/identificador|^id$/);
    if (di < 0 || vi < 0) return [];
    const out = [];
    for (const line of lines.slice(1)) {
      const row = split(line), date = parseDateAny(row[di]), amount = parseMoney(row[vi]);
      if (date && amount) out.push({ date, desc: prettyDesc(ti >= 0 ? row[ti] : ''), amount, extId: ii >= 0 ? row[ii] : '' });
    }
    return out;
  }
  function importStatement() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ofx,.qfx,.csv,.txt';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const txt = await readFileText(file);
      const rows = /<OFX>|<STMTTRN>/i.test(txt) ? parseOFX(txt) : parseCSV(txt);
      if (!rows.length) return toast('Não encontrei lançamentos nesse arquivo. Use o extrato em OFX ou CSV do seu banco.');
      importPreview(rows, file.name);
    };
    input.click();
  }
  function importPreview(raw, fileName) {
    const hist = historyMap();
    const state = { acc: cashOrAll()[0].id, invert: false };
    const rows = raw.map((r, i) => ({ ...r, i, on: true, cat: null }));
    // Faturas de cartão em CSV costumam trazer compras como valores positivos
    const autoInvert = () => isCard(getAcc(state.acc)) && rows.filter((r) => r.amount > 0).length > rows.length / 2;
    const analyze = () => {
      rows.forEach((r) => {
        const signed = state.invert ? -r.amount : r.amount;
        r.type = signed >= 0 ? 'income' : 'expense';
        r.abs = Math.abs(signed);
        if (!r.cat || getCat(r.cat).type !== r.type) r.cat = guessCategory(r.desc, r.type, hist) || fallbackCat(r.type);
        const nd = norm(r.desc);
        r.dup = S.transactions.some((t) => t.accountId === state.acc && ((r.extId && t.extId === r.extId) || (t.date === r.date && t.amount === r.abs && norm(t.desc) === nd)));
      });
    };
    const resetChecks = () => rows.forEach((r) => (r.on = !r.dup && r.abs > 0));
    state.invert = autoInvert();
    analyze(); resetChecks();
    const dups = rows.filter((r) => r.dup).length;
    openModal({
      title: 'Importar extrato',
      body: `<p class="muted small">${esc(fileName)} · ${rows.length} lançamentos${dups ? ` · ${dups} já estavam no app e ficaram desmarcados` : ''}. Confira as categorias antes de importar.</p>
        <div class="row2" style="margin-top:12px">
          <label class="field"><span>Para qual conta ou cartão?</span><select id="imp-acc">${accOptions(state.acc)}</select></label>
          <label class="check imp-inv"><input type="checkbox" id="imp-inv"> Inverter sinais</label>
        </div>
        <div class="imp-tools"><span id="imp-count"></span><button type="button" class="link" id="imp-all">Marcar/desmarcar todos</button></div>
        <div class="imp-list" id="imp-list"></div>
        <button class="btn primary block" id="imp-go" style="margin-top:12px">Importar</button>`,
      onMount(w, close) {
        const list = $('#imp-list', w);
        const count = () => {
          const n = rows.filter((r) => r.on).length;
          $('#imp-count', w).textContent = `${n} de ${rows.length} selecionados`;
          $('#imp-go', w).textContent = n ? `Importar ${n} lançamento${n > 1 ? 's' : ''}` : 'Nada selecionado';
          $('#imp-go', w).disabled = !n;
        };
        const paint = () => {
          $('#imp-inv', w).checked = state.invert;
          list.innerHTML = rows.map((r) => `<div class="imp-row ${r.on ? '' : 'off'}">
            <input type="checkbox" data-i="${r.i}" ${r.on ? 'checked' : ''} aria-label="Importar ${esc(r.desc)}">
            <div class="imp-main"><b>${esc(r.desc || '(sem descrição)')}</b><small>${shortDate(r.date)}${r.dup ? ' <em class="tag">já existe</em>' : ''}</small>
              <select class="imp-cat" data-c="${r.i}" aria-label="Categoria">${S.categories.filter((c) => c.type === r.type).map((c) => `<option value="${c.id}" ${c.id === r.cat ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}</select></div>
            <b class="imp-amt ${r.type === 'income' ? 'pos-t' : ''}">${r.type === 'income' ? '+' : '−'}${fmt(r.abs, { force: true })}</b></div>`).join('');
          count();
        };
        list.addEventListener('change', (e) => {
          const { i, c } = e.target.dataset;
          if (i !== undefined) { rows[i].on = e.target.checked; e.target.closest('.imp-row').classList.toggle('off', !rows[i].on); count(); }
          if (c !== undefined) rows[c].cat = e.target.value;
        });
        $('#imp-acc', w).onchange = (e) => { state.acc = e.target.value; state.invert = autoInvert(); analyze(); resetChecks(); paint(); };
        $('#imp-inv', w).onchange = (e) => { state.invert = e.target.checked; analyze(); paint(); };
        $('#imp-all', w).onclick = () => { const all = rows.every((r) => r.on); rows.forEach((r) => (r.on = !all)); paint(); };
        paint();
        $('#imp-go', w).onclick = () => {
          const sel = rows.filter((r) => r.on);
          if (!sel.length) return;
          const snap = snapshot(), now = Date.now();
          sel.forEach((r, k) => {
            const tx = { id: uid(), type: r.type, amount: r.abs, desc: r.desc || getCat(r.cat).name, categoryId: r.cat, accountId: state.acc, toAccountId: null, date: r.date, note: 'Importado', createdAt: now + k };
            if (r.extId) tx.extId = r.extId;
            S.transactions.push(tx);
          });
          save(); close();
          UI.month = sel.map((r) => r.date).sort().pop().slice(0, 7);
          UI.mode = 'list';
          if (currentView() !== 'extrato') location.hash = '#extrato'; else render();
          toast(`${sel.length} lançamentos importados`, { undo: () => restore(snap) });
        };
      },
    });
  }

  // ================= Diversos =================
  function moreSheet() {
    openModal({
      title: 'Mais',
      body: `<div class="more-grid">${MORE.map((id) => `<a href="#${id}" class="more-item" data-close>${ICON[VIEWS[id].icon]}<b>${VIEWS[id].title}</b><small>${VIEWS[id].sub}</small></a>`).join('')}</div>
        <div class="btn-grid">
          <button class="btn ghost" data-action="import-statement">${ICON.up} Importar extrato</button>
          <button class="btn ghost" data-action="pot-distribute">⚡ Distribuir nos potes</button>
          <button class="btn ghost" data-action="forecast">📅 Previsão do mês</button>
          ${S.accounts.length > 1 ? `<button class="btn ghost" data-action="transfer">${ICON.swap} Transferir entre contas</button>` : ''}
        </div>`,
    });
  }
  function potYieldModal(potId) {
    const p = getPot(potId);
    if (!p) return;
    openModal({
      title: `📈 Rendimento · ${esc(p.name)}`, size: 'small',
      body: `<form class="form" autocomplete="off" novalidate>
        <p class="muted small">Quanto o dinheiro desse pote rendeu (CDB, caixinha, poupança…)? Esse valor não sai de nenhuma conta.</p>
        <label class="amount-field"><span>R$</span><input name="amount" inputmode="decimal" placeholder="0,00" aria-label="Valor do rendimento"></label>
        <label class="field"><span>Data</span><input type="date" name="date" value="${todayStr()}"></label>
        <button class="btn primary block" type="submit">Adicionar rendimento</button></form>`,
      onMount(w, close) {
        const f = $('form', w), el = f.elements;
        setTimeout(() => el.amount.focus(), 280);
        f.onsubmit = (e) => {
          e.preventDefault();
          const amount = evalMoney(el.amount.value);
          if (!amount) { shake(el.amount); return toast('Digite o valor'); }
          const before = potBalance(potId);
          S.potMoves.push({ id: uid(), potId, accountId: null, amount, date: el.date.value || todayStr(), note: 'Rendimento', createdAt: Date.now() });
          save(); close(); render();
          if (!celebrateIfDone(potId, before)) toast(`Rendimento de ${fmt(amount, { force: true })} registrado 📈`);
        };
      },
    });
  }

  // ================= Conta, login e inicialização =================
  function cloudCard() {
    if (!CLOUD_CONFIGURED) {
      return '<section class="card"><h3>Sincronização</h3><p class="muted small">Desligada. Para usar a mesma conta no celular e no PC, preencha o arquivo <b>config.js</b> com os dados do Supabase (o passo a passo está no README).</p></section>';
    }
    if (!user) {
      return '<section class="card"><h3>Sincronização</h3><p class="muted small">Você está usando sem conta: os dados ficam só neste aparelho. Entre para acessar do celular e do PC. O que já está aqui vai junto.</p><div class="btn-grid"><button class="btn primary" data-action="login">Entrar ou criar conta</button></div></section>';
    }
    return `<section class="card"><div class="card-head"><h3>Sua conta</h3><span data-sync-slot="full">${syncPill(true)}</span></div>
      <div class="list-row" style="cursor:default"><span class="avatar" style="--c:var(--accent)">${esc((user.email || '?').charAt(0).toUpperCase())}</span><span>${esc(user.email || '')}<br><small class="muted">${sync.lastSync ? 'Última sincronização ' + timeAgo(sync.lastSync) : 'Ainda não sincronizado'}</small></span></div>
      <div class="btn-grid">
        <button class="btn ghost" data-action="sync-now">${ICON.cloud} Sincronizar agora</button>
        <button class="btn ghost" data-action="change-pass">Trocar senha</button>
        <button class="btn danger-ghost" data-action="logout">${ICON.logout} Sair da conta</button>
      </div></section>`;
  }
  function authError(err) {
    const m = String((err && err.message) || err || '');
    if (/invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
    if (/already registered|already been registered|already exists/i.test(m)) return 'Esse e-mail já tem conta. Use a aba Entrar.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
    if (/fetch|network/i.test(m)) return 'Sem conexão. Verifique sua internet.';
    return 'Não deu certo: ' + m;
  }
  function hideAuth() { $('#auth').hidden = true; $('.app').hidden = false; }
  function showAuth(mode = 'login') {
    $('.app').hidden = true;
    const box = $('#auth');
    box.hidden = false;
    if (mode === 'loading') {
      box.innerHTML = '<div class="auth-card"><img src="icon.svg" class="auth-logo" alt=""><p class="muted">Carregando seus dados…</p><div class="spinner"></div></div>';
      return;
    }
    let tab = mode;
    const paint = (email = '') => {
      const copy = {
        login: 'Entre para ver seus gastos, potes e metas em qualquer aparelho.',
        signup: 'Crie sua conta. Tudo fica sincronizado entre o celular e o PC.',
        reset: 'Digite seu e-mail e enviamos um link para criar uma nova senha.',
      }[tab];
      box.innerHTML = `<div class="auth-card">
        <img src="icon.svg" class="auth-logo" alt="">
        <div><h1>Banco do Murilo</h1><p class="muted small">${copy}</p></div>
        ${tab !== 'reset' ? `<div class="seg"><button type="button" data-tab="login" class="${tab === 'login' ? 'on' : ''}">Entrar</button><button type="button" data-tab="signup" class="${tab === 'signup' ? 'on' : ''}">Criar conta</button></div>` : ''}
        <form class="form" novalidate>
          <label class="field"><span>E-mail</span><input id="auth-email" name="email" type="email" autocomplete="email" inputmode="email" value="${esc(email)}"></label>
          ${tab !== 'reset' ? `<label class="field"><span>Senha</span><input id="auth-pass" name="pass" type="password" autocomplete="${tab === 'signup' ? 'new-password' : 'current-password'}">${tab === 'signup' ? '<small>Pelo menos 6 caracteres.</small>' : ''}</label>` : ''}
          <p class="auth-msg" id="auth-msg" role="status"></p>
          <button class="btn primary block" type="submit">${{ login: 'Entrar', signup: 'Criar conta', reset: 'Enviar link' }[tab]}</button>
        </form>
        <div class="auth-links">
          ${tab === 'login' ? '<button type="button" data-tab="reset">Esqueci minha senha</button>' : tab === 'reset' ? '<button type="button" data-tab="login">Voltar para o login</button>' : ''}
          <button type="button" data-guest>Usar sem conta (só neste aparelho)</button>
        </div>
      </div>`;
      const f = $('form', box), el = f.elements, msg = $('#auth-msg', box);
      const say = (txt, ok) => { msg.textContent = txt; msg.className = 'auth-msg ' + (ok ? 'ok' : 'err'); };
      $$('[data-tab]', box).forEach((b) => (b.onclick = () => { tab = b.dataset.tab; paint(el.email.value); }));
      $('[data-guest]', box).onclick = () => { ls.set(GUEST_FLAG, true); startGuest(); };
      setTimeout(() => (el.email.value && el.pass ? el.pass : el.email).focus(), 50);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const email = el.email.value.trim(), pass = el.pass ? el.pass.value : '';
        if (!/^\S+@\S+\.\S+$/.test(email)) { shake(el.email); return say('Digite um e-mail válido.'); }
        if (tab !== 'reset' && pass.length < 6) { shake(el.pass); return say('A senha precisa ter pelo menos 6 caracteres.'); }
        const btn = $('button[type=submit]', f), label = btn.textContent;
        btn.disabled = true; btn.textContent = 'Aguarde…'; say('');
        const redirect = location.origin + location.pathname;
        try {
          if (tab === 'login') {
            const { error } = await sb.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            return; // o onAuthStateChange abre o app
          }
          if (tab === 'signup') {
            const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: redirect } });
            if (error) throw error;
            if (data.session) return;
            say(`Conta criada! Abra o link que enviamos para ${email} para confirmar, depois entre aqui.`, true);
          } else {
            const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect });
            if (error) throw error;
            say('Pronto! Se esse e-mail tiver conta, o link chega em instantes.', true);
          }
        } catch (err) { say(authError(err)); }
        btn.disabled = false; btn.textContent = label;
      };
    };
    paint();
  }
  function newPasswordModal() {
    if (!sb) return toast('Sem conexão com a nuvem agora');
    openModal({
      title: 'Nova senha', size: 'small',
      body: '<form class="form" novalidate><label class="field"><span>Nova senha</span><input name="pass" type="password" autocomplete="new-password"><small>Pelo menos 6 caracteres.</small></label><button class="btn primary block" type="submit">Salvar senha</button></form>',
      onMount(w, close) {
        const f = $('form', w);
        setTimeout(() => f.elements.pass.focus(), 280);
        f.onsubmit = async (e) => {
          e.preventDefault();
          const pass = f.elements.pass.value;
          if (pass.length < 6) { shake(f.elements.pass); return toast('Use pelo menos 6 caracteres'); }
          const { error } = await sb.auth.updateUser({ password: pass });
          if (error) return toast(authError(error));
          close(); toast('Senha atualizada ✓');
        };
      },
    });
  }
  function logout() {
    const go = async () => {
      try { channel?.unsubscribe(); await sb?.auth.signOut(); } catch (e) { /* sai mesmo offline */ }
      const k = userKeys(user.id);
      [k.data, k.base, k.meta, LAST_USER_KEY].forEach((key) => ls.del(key));
      location.hash = '';
      location.reload();
    };
    if (sync.dirty) confirmBox({ title: 'Sair da conta?', text: 'Algumas alterações ainda não chegaram na nuvem e vão se perder neste aparelho.', ok: 'Sair mesmo assim', danger: true, onOk: go });
    else go();
  }

  function loadUserCache() {
    const k = userKeys(user.id), cached = ls.get(k.data), meta = ls.get(k.meta) || {};
    if (cached) S = migrate(cached);
    sync.version = meta.version || 0;
    sync.dirty = !!meta.dirty;
    sync.lastSync = meta.lastSync || 0;
    sync.base = ls.get(k.base);
    return !!cached;
  }
  function start() {
    applyTheme();
    if (!started) { started = true; render(); } else render();
    runAutoRecurring();
    if (!S.settings.onboarded) setTimeout(onboarding, 300);
  }
  function startGuest() {
    user = null;
    const d = ls.get(GUEST_KEY);
    S = d ? migrate(d) : freshState();
    setStatus(CLOUD_CONFIGURED ? 'guest' : 'local');
    hideAuth();
    start();
  }
  function startOfflineUser(last) {
    user = last;
    if (!loadUserCache()) S = freshState();
    hideAuth(); start(); setStatus('offline');
  }
  async function enterUser(u) {
    if (entering === u.id) return;
    entering = u.id;
    user = { id: u.id, email: u.email };
    ls.set(LAST_USER_KEY, user);
    ls.del(GUEST_FLAG);
    let have = loadUserCache();
    if (have) { hideAuth(); start(); setStatus(navigator.onLine ? 'pending' : 'offline'); } else showAuth('loading');
    try {
      const row = await pull();
      if (row) {
        if (!have || !sync.dirty) applyRemote(row);
        else if (row.version !== sync.version) await reconcile();
        if (sync.dirty) push(); else setStatus('ok');
      } else {
        if (!have) {
          // Primeiro acesso da conta: leva junto o que já estava sendo usado sem conta neste aparelho
          const guest = ls.get(GUEST_KEY);
          const useGuest = guest && guest.settings && guest.settings.onboarded && (guest.transactions || []).length;
          S = useGuest ? migrate(guest) : freshState();
          if (useGuest) setTimeout(() => toast('Os dados deste aparelho foram para a sua conta ☁️'), 700);
        }
        sync.version = 0;
        save();
      }
      have = true;
    } catch (e) {
      console.warn('sync', e);
      setStatus(navigator.onLine ? 'error' : 'offline');
      if (!have) {
        entering = null;
        showAuth('login');
        toast('Não consegui carregar seus dados. Verifique a internet e tente de novo.');
        return;
      }
    }
    hideAuth();
    start();
    if (sb) subscribe();
  }
  async function boot() {
    renderShell();
    if (!CLOUD_CONFIGURED) return startGuest();
    if (!window.supabase) {
      // Biblioteca do Supabase não carregou (sem internet): abre a cópia local do último usuário
      const last = ls.get(LAST_USER_KEY);
      return last ? startOfflineUser(last) : startGuest();
    }
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setTimeout(newPasswordModal, 500);
      if (session && session.user) setTimeout(() => enterUser(session.user), 0);
      else if (event === 'SIGNED_OUT' && user) location.reload();
    });
    let session = null;
    try { session = (await sb.auth.getSession()).data.session; } catch (e) { /* offline */ }
    if (session) return enterUser(session.user);
    if (user) return; // o onAuthStateChange já entrou
    if (ls.get(GUEST_FLAG)) return startGuest();
    const last = ls.get(LAST_USER_KEY);
    if (last && !navigator.onLine) return startOfflineUser(last);
    showAuth('login');
  }

  // ================= Eventos =================
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action, id = el.dataset.id;
    if (el.closest('.modal-wrap')) closeTop(); // ações dentro de um modal abrem outro no lugar
    switch (a) {
      case 'new-tx': txModal(null); break;
      case 'edit-tx': { const tx = S.transactions.find((t) => t.id === id); if (tx) txModal(tx); break; }
      case 'month-prev': UI.month = addMonths(UI.month, -1); UI.filters.day = ''; render(); break;
      case 'month-next': UI.month = addMonths(UI.month, 1); UI.filters.day = ''; render(); break;
      case 'month-today': UI.month = curMonth(); UI.filters.day = ''; render(); break;
      case 'month-set':
        UI.month = el.dataset.ym; UI.filters.day = '';
        if (currentView() === 'relatorios') { UI.mode = 'list'; location.hash = '#extrato'; } else render();
        break;
      case 'year-prev': UI.year--; render(); break;
      case 'year-next': UI.year++; render(); break;
      case 'year-today': UI.year = new Date().getFullYear(); render(); break;
      case 'toggle-all': UI.filters.all = !UI.filters.all; UI.filters.day = ''; render(); break;
      case 'ext-mode': UI.mode = el.dataset.v; UI.filters.day = ''; render(); break;
      case 'cal-day': UI.filters.day = el.dataset.d; UI.mode = 'list'; render(); break;
      case 'clear-day': UI.filters.day = ''; render(); break;
      case 'more': moreSheet(); break;
      case 'forecast': forecastModal(); break;
      case 'card-invoice': invoiceModal(id); break;
      case 'card-pay': payCardModal(id); break;
      case 'debt-new': debtModal(); break;
      case 'debt-edit': debtModal(S.debts.find((d) => d.id === id)); break;
      case 'debt-detail': debtDetail(id); break;
      case 'debt-pay': debtPayModal(id); break;
      case 'debt-tab': UI.debtTab = el.dataset.v; render(); break;
      case 'pot-yield': potYieldModal(id); break;
      case 'import-statement': importStatement(); break;
      case 'sync-now':
        if (user && sb) { if (sync.dirty) push(); else checkRemote(); toast(navigator.onLine ? 'Sincronizando…' : 'Sem internet. Sincroniza quando voltar.'); }
        else if (user) toast('Sem conexão com a nuvem agora');
        else if (CLOUD_CONFIGURED) showAuth('login');
        break;
      case 'login': ls.del(GUEST_FLAG); if (sb) showAuth('login'); else toast('Sem internet para entrar agora'); break;
      case 'logout': logout(); break;
      case 'change-pass': newPasswordModal(); break;
      case 'toggle-hide': S.settings.hideValues = !S.settings.hideValues; save(); render(); break;
      case 'filter-type': UI.filters.type = el.dataset.v; render(); break;
      case 'pot-new': {
        const t = POT_TEMPLATES[el.dataset.tpl];
        potModal(null, t || {});
        break;
      }
      case 'pot-detail': potDetail(id); break;
      case 'pot-edit': potModal(getPot(id)); break;
      case 'pot-move': potMoveModal(id, el.dataset.dir || 'in', Number(el.dataset.amount) || 0); break;
      case 'pot-distribute': distributeModal(Number(el.dataset.amount) || 0); break;
      case 'budget-edit': budgetModal(); break;
      case 'bill-new': billModal(); break;
      case 'bill-edit': billModal(S.bills.find((b) => b.id === id)); break;
      case 'bill-pay': payBill(id); break;
      case 'bill-unpay': unpayBill(id); break;
      case 'acc-new': accModal(null, el.dataset.kind); break;
      case 'acc-edit': accModal(S.accounts.find((x) => x.id === id)); break;
      case 'transfer': txModal(null, { type: 'transfer' }); break;
      case 'cat-new': catModal(null, el.dataset.type); break;
      case 'cat-edit': catModal(S.categories.find((c) => c.id === id)); break;
      case 'theme': S.settings.theme = el.dataset.v; save(); applyTheme(); render(); break;
      case 'export-json': exportJSON(); break;
      case 'import-json': importJSON(); break;
      case 'export-csv': exportCSV(el.dataset.scope === 'filtered' ? filteredItems() : allItems()); break;
      case 'reset-all': resetAll(); break;
      case 'install': installPrompt?.prompt(); installPrompt = null; break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalStack.length) { closeTop(); return; }
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
    const free = started && !typing && !modalStack.length && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (free && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); txModal(null); }
    if (free && e.key === '/') {
      e.preventDefault();
      if (currentView() !== 'extrato') location.hash = '#extrato';
      setTimeout(() => $('#ext-q')?.focus(), 60);
    }
    if (e.key === 'Enter' && e.target.matches('article[data-action]')) e.target.click();
  });
  document.addEventListener('input', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { UI.filters[f.dataset.filter] = f.value; renderTxList(); }
  });
  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-setting]');
    if (s) { S.settings[s.dataset.setting] = s.value.trim(); save(); render(); }
  });
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  // Outra aba do mesmo navegador salvou: pega a versão nova
  window.addEventListener('storage', (e) => {
    if (!started || e.key !== dataKey()) return;
    if (user) loadUserCache(); else S = migrate(ls.get(GUEST_KEY) || freshState());
    render();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; if (currentView() === 'ajustes') render(); });

  // Atualiza a tela quando o dia vira (app aberto à meia-noite, ou voltando ao app)
  let lastDay = todayStr();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !started) return;
    if (todayStr() !== lastDay) { lastDay = todayStr(); UI.month = curMonth(); runAutoRecurring(); render(); }
    checkRemote();
  });
  window.addEventListener('online', () => { if (user && sb) { if (sync.dirty) push(); else checkRemote(); } });
  window.addEventListener('offline', () => { if (user) setStatus('offline'); });
  setInterval(() => { if (document.visibilityState === 'visible') checkRemote(); }, 90000);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // ================= Início =================
  boot();
})();
