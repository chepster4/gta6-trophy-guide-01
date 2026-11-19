// Vice City Trophy Ledger — rendering: the tracker list, the detail panel,
// the roadmap stages and the missables view. All text comes from state.trophies.
import { isEarned, toggleEarned, selectTrophy, isStoryHidden, visibleTrophies } from './app.js';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const emptyNote = document.getElementById('emptyNote');
const listCount = document.getElementById('listCount');

const STAGE_INFO = [
  { n: 1, title: 'Play the story (Chapters 1–4 + finale)', text: 'Finish all 91 story missions. Every chapter trophy and every named-mission trophy unlocks here, including the gold for the final mission. Do Lucia\u2019s balcony meditation in Chapter 1, keep a manual save at the start of each chapter, and do not use cheats — they disable trophies.' },
  { n: 2, title: 'Stranger strands (Andy, Kenton, Billy, Randy, Tyrone, Bret)', text: 'Play the six stranger strands to their final missions, plus two more strands for the silver Strangers & Freaks. Strands appear as side missions across Leonida; the time-limited ones do not affect trophies, and there are far more optional missions than the checklist needs.' },
  { n: 3, title: 'Activities & minigames', text: 'Try all 9 activity types once, gold all 42 shooting-range challenges, win drone races at all 14 locations, win 20 different races, beat Cal at fishing, finish an arcade game and bowl at Kolt & Associates. Repeatable, nothing missable — a good mid-game breather.' },
  { n: 4, title: 'Collectibles & exploration', text: 'Meditate at all 18 spots, finish card sets, WAiNK-scan 100 locations, discover 100 vehicles, explore all 52 areas, buy all 8 garages and register 10 vehicles to Scooter Bros. Scan and collect as you travel instead of hunting them down later.' },
  { n: 5, title: 'Crime & robberies', text: 'Rob 5 bank vaults, an armored truck, a jewelry store unseen, and one illegal operation per gang — plus the partner trophies (lose a 4-star wanted level together; rob 3 shops back-to-back). Robbery trophies open up around Chapters 3 and 4.' },
  { n: 6, title: 'Grind & cleanup', text: '250 stunts, 50 challenges, $250,000 laundered in Marked Bills, $100,000 spent in shops. These are cumulative totals that grow while you do everything else; finish the leftovers in free roam.' },
  { n: 7, title: 'Platinum', text: 'Clear the 35-item 100% checklist (Progress, then Stats, then 100% Completion) for A Long Road, then Vice Got a Price! pops. Nothing on the checklist is missable — every item can be done after the credits.' },
];

function badge(trophy) {
  const parts = [`<span class="badge ${trophy.grade}">${trophy.grade}</span>`];
  if (trophy.kind === 'story') parts.push('<span class="badge hidden-flag">Hidden on PSN</span>');
  if (trophy.missable) parts.push('<span class="badge missable-flag">Missable</span>');
  if (trophy.count) parts.push(`<span class="badge count-flag">× ${trophy.count.toLocaleString('en-US')}</span>`);
  return parts.join(' ');
}

function displayName(state, trophy) {
  return isStoryHidden(trophy) ? 'Hidden trophy — earn it to reveal its name' : trophy.name;
}

function displayDesc(state, trophy) {
  return isStoryHidden(trophy) ? 'This story trophy stays hidden until you earn it. Tick it off in your game and it will reveal itself here.' : trophy.description;
}

export function renderTracker(state) {
  const shown = visibleTrophies();
  listCount.textContent = `Showing ${shown.length} of ${state.trophies.length} trophies · ${state.earned.size} earned`;
  emptyNote.hidden = shown.length !== 0;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = (isEarned(t) ? 'earned' : '') + (state.selected === t ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => toggleEarned(t));
    box.addEventListener('click', (e) => e.stopPropagation());
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = displayName(state, t);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = displayDesc(state, t);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.innerHTML = badge(t);
    main.append(name, desc, meta);
    li.append(box, main);
    li.addEventListener('click', () => selectTrophy(t));
    listEl.append(li);
  }
}

export function renderDetail(state) {
  const t = state.selected;
  if (!t) {
    detailEl.innerHTML = `<p class="detail-empty"><strong>Pick a trophy</strong> to see its guide. Click any trophy in the list — its guide, sources and missable warning appear here.</p>
      <p class="detail-empty">Start with the one trophy that can be missed: <strong>Positive Mental Attitude</strong>. Search for it above, or open the Missables tab.</p>`;
    return;
  }
  const hidden = isStoryHidden(t);
  const earned = isEarned(t);
  detailEl.innerHTML = `
    <div class="trophy-meta">${badge(t)}</div>
    <h2>${escapeHtml(displayName(state, t))}</h2>
    <p class="detail-desc">${escapeHtml(displayDesc(state, t))}</p>
    <p class="detail-status">Status: ${earned ? '<span class="earned">✓ Earned</span>' : '<span class="not-earned">Not earned yet</span>'} · Stage ${t.roadmapStage} of the roadmap</p>
    ${t.missable ? `<div class="missable-box"><strong>⚠ Missable — possibly.</strong> ${escapeHtml(t.guide.split('. ')[0])}. Read the full guide below before you finish Chapter 1.</div>` : ''}
    <h3>Guide — in our own words</h3>
    <p class="guide-text">${hidden ? 'This guide is hidden with the trophy. Earn it in the game (or uncheck “Hide story spoilers”) to read it.' : escapeHtml(t.guide)}</p>
    <h3>Source</h3>
    <p class="source-line"><a href="${escapeAttr(t.source.url)}" target="_blank" rel="noopener">${escapeHtml(t.source.name)}</a></p>
    <p class="source-line">Names and descriptions are PlayStation&rsquo;s official text; the guide above is written for this ledger and cites its source, never copies it.</p>
    <button type="button" class="mark-btn${earned ? ' earned' : ''}" id="markBtn">${earned ? '✓ Earned — click to unmark' : 'Mark as earned'}</button>`;
  document.getElementById('markBtn').addEventListener('click', () => toggleEarned(t));
}

export function renderRoadmap(state) {
  const list = document.getElementById('stageList');
  list.replaceChildren();
  for (const stage of STAGE_INFO) {
    const inStage = state.trophies.filter((t) => t.roadmapStage === stage.n);
    const done = inStage.filter((t) => isEarned(t)).length;
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const prog = document.createElement('p');
    prog.className = 'stage-progress';
    prog.textContent = `${done} of ${inStage.length} earned in this stage`;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const ul = document.createElement('ul');
    ul.className = 'stage-trophies';
    for (const t of inStage) {
      const item = document.createElement('li');
      if (isEarned(t)) item.className = 'earned';
      item.textContent = t.name;
      item.addEventListener('click', () => { selectTrophy(t); document.getElementById('tab-tracker').click(); });
      ul.append(item);
    }
    li.append(h, prog, text, ul);
    list.append(li);
  }
}

export function renderMissables(state) {
  const wrap = document.getElementById('missableList');
  wrap.replaceChildren();
  for (const t of state.trophies.filter((x) => x.missable)) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = `⚠ ${t.name} — ${t.grade}`;
    const p = document.createElement('p');
    p.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'source-line';
    const a = document.createElement('a');
    a.href = t.source.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = t.source.name;
    src.append('Source: ', a);
    const status = document.createElement('p');
    status.className = 'detail-status';
    status.innerHTML = `Status: ${isEarned(t) ? '<span class="earned">✓ Earned — the risk is behind you</span>' : '<span class="not-earned">Not earned yet — do the Chapter 1 meditation first</span>'}`;
    card.append(h, p, src, status);
    wrap.append(card);
  }
  const none = document.createElement('p');
  none.textContent = 'That is the whole list: 1 flagged trophy out of 55. PowerPyx and GTABase agree on it, and both say it is unconfirmed whether the Chapter 1 meditation is actually required — doing it is simply the safe move.';
  wrap.append(none);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
