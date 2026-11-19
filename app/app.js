// Vice City Trophy Ledger — app state: saved progress, filters, tabs, export/import.
// The trophy data lives in data/trophies.json and is fetched from this same folder;
// the app makes no network request at run time.
import { renderTracker, renderDetail, renderRoadmap, renderMissables } from './render.js';

const STORE_KEY = 'vice-city-trophy-ledger-v1';
const SETTINGS_KEY = 'vice-city-trophy-ledger-settings-v1';

const state = {
  trophies: [],
  earned: new Set(),
  kind: 'all',
  grade: 'all',
  search: '',
  earnedOnly: false,
  hideSpoilers: true,
  selected: null,
  tab: 'tracker',
};

function loadStored() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    if (Array.isArray(saved)) state.earned = new Set(saved.filter((n) => typeof n === 'string'));
  } catch { state.earned = new Set(); }
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof settings.hideSpoilers === 'boolean') state.hideSpoilers = settings.hideSpoilers;
    if (typeof settings.earnedOnly === 'boolean') state.earnedOnly = settings.earnedOnly;
  } catch { /* keep defaults */ }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...state.earned]));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hideSpoilers: state.hideSpoilers, earnedOnly: state.earnedOnly }));
}

export function isEarned(trophy) {
  return state.earned.has(trophy.name);
}

export function toggleEarned(trophy) {
  if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
  else state.earned.add(trophy.name);
  saveProgress();
  renderAll();
}

export function selectTrophy(trophy) {
  state.selected = trophy;
  renderTracker(state);
  renderDetail(state);
}

export function isStoryHidden(trophy) {
  return state.hideSpoilers && trophy.kind === 'story' && !isEarned(trophy);
}

export function visibleTrophies() {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.kind === 'online') return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedOnly && !isEarned(t)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgressCard() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById('earnedCount').textContent = String(earned);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(earned));
  document.getElementById('platinumNote').textContent =
    earned === total
      ? 'Platinum earned — Vice Got a Price! You are a Leonida Legend.'
      : `Platinum ${pct}% there — Vice Got a Price! waits at the end.`;
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('gradeCounts').innerHTML = grades
    .map((g) => {
      const inGrade = state.trophies.filter((t) => t.grade === g);
      const done = inGrade.filter((t) => isEarned(t)).length;
      return `<li><b>${done}/${inGrade.length}</b> ${g}</li>`;
    })
    .join('');
  const stagesDone = [1, 2, 3, 4, 5, 6, 7]
    .map((s) => {
      const inStage = state.trophies.filter((t) => t.roadmapStage === s);
      const done = inStage.filter((t) => isEarned(t)).length;
      return `S${s} ${done}/${inStage.length}`;
    })
    .join(' · ');
  document.getElementById('stageCounts').textContent = `By roadmap stage: ${stagesDone}`;
  document.getElementById('missableBadge').textContent = String(state.trophies.filter((t) => t.missable).length);
}

export function renderAll() {
  renderProgressCard();
  renderTracker(state);
  renderDetail(state);
  renderRoadmap(state);
  renderMissables(state);
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${tab}`));
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...state.earned], exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vice-city-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(state.trophies.map((t) => t.name));
    state.earned = new Set(names.filter((n) => known.has(n)));
    saveProgress();
    renderAll();
  } catch {
    alert('That file is not a Vice City Trophy Ledger progress export.');
  }
}

function wireControls() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; renderTracker(state); });
  document.getElementById('grade').addEventListener('change', (e) => { state.grade = e.target.value; renderTracker(state); });
  document.getElementById('kindPills').addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    state.kind = pill.dataset.kind;
    document.querySelectorAll('.pill').forEach((p) => p.classList.toggle('active', p === pill));
    renderTracker(state);
  });
  const spoilerBox = document.getElementById('spoilers');
  spoilerBox.checked = state.hideSpoilers;
  spoilerBox.addEventListener('change', () => { state.hideSpoilers = spoilerBox.checked; saveSettings(); renderTracker(state); renderDetail(state); });
  const earnedBox = document.getElementById('earnedOnly');
  earnedBox.checked = state.earnedOnly;
  earnedBox.addEventListener('change', () => { state.earnedOnly = earnedBox.checked; saveSettings(); renderTracker(state); });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (e) => { importProgress(e.target.files[0]); e.target.value = ''; });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies? This cannot be undone.')) return;
    state.earned = new Set();
    saveProgress();
    renderAll();
  });
}

async function boot() {
  loadStored();
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  state.trophies = doc.trophies;
  const tab = (location.hash || '#tracker').slice(1);
  if (['tracker', 'roadmap', 'missables', 'sources'].includes(tab)) switchTab(tab);
  wireControls();
  renderAll();
  window.addEventListener('hashchange', () => {
    const next = location.hash.slice(1);
    if (['tracker', 'roadmap', 'missables', 'sources'].includes(next)) switchTab(next);
  });
}

boot();
