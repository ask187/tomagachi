import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { useUI } from '../App';
import { detectInsights } from '../engine/insights';
import { Badge } from '../components/ui';
import Pet from '../components/Pet';
import { RULES, WEEKDAYS } from '../engine/config';
import type { Snapshot } from '../engine/types';

export default function Insights() {
  const { journey, snaps, day, dispatch, state, isDemo, snap } = useStore();
  const ui = useUI();
  const [table, setTable] = useState(false);
  const hist = snaps.slice(0, day + 1);
  const insights = useMemo(() => detectInsights(journey.habits, snaps, day).filter((i) => !state.dismissed.includes(i.id)), [journey.habits, snaps, day, state.dismissed]);

  const scored = hist.filter((s) => s.score !== null && s.status !== 'rest' && s.status !== 'paused');
  const completion = scored.length ? Math.round(scored.reduce((a, s) => a + (s.score ?? 0), 0) / scored.length) : 0;
  const last7 = hist.slice(-7);
  const weekly = last7.filter((s) => s.qualifying).length;
  const weeklyEligible = last7.filter((s) => s.status === 'active' || s.status === 'inactive').length;
  const missions = snap.totalMissions;

  return (
    <div className="screen">
      <div className="row">
        <h2>Progress & insights</h2>
        {isDemo && <Badge tone="demo">sample history</Badge>}
      </div>

      <div className="kpis">
        <div className="kpi">
          <b>{completion}%</b>
          <small>Avg completion</small>
        </div>
        <div className="kpi">
          <b>
            {weekly}/{weeklyEligible}
          </b>
          <small>Qualifying days (7d)</small>
        </div>
        <div className="kpi">
          <b>{snap.bestStreak}</b>
          <small>Best streak</small>
        </div>
        <div className="kpi">
          <b>{missions}</b>
          <small>Missions done</small>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <h4>Daily score</h4>
          <button className="link small" onClick={() => setTable((t) => !t)}>
            {table ? 'Chart view' : 'Table view'}
          </button>
        </div>
        {table ? <HistoryTable hist={hist} /> : <ScoreChart hist={hist} />}
        <p className="tiny muted">Hatched = rest, pause or unknown data — excluded, never counted as failure. Dashed line = qualifying ({RULES.qualifyingScore}).</p>
      </div>

      <div className="card">
        <h4>Pet condition (temporary)</h4>
        <ConditionChart hist={hist} />
      </div>

      <div className="section-head">
        <h3>
          Insight Engine <Badge tone="ai">✨ AI</Badge>
        </h3>
      </div>
      <p className="tiny muted">On-device pattern analysis of your history. Findings are correlations — suggestions only apply if you approve them.</p>

      {insights.length === 0 && <div className="card small muted">Not enough history yet. Keep logging for a few days and patterns will show up here.</div>}
      {insights.map((ins) => (
        <div key={ins.id} className={`insight insight--${ins.kind}`}>
          {ins.kind === 'pattern' && (
            <div className="insight__pet">
              <Pet color={journey.profile.petColor} stage={snap.stage} condition="stable" branch={snap.branch} reaction="clock" reactionKey={1} still={state.prefs.reducedMotion} size={74} />
            </div>
          )}
          <div className="insight__body">
            <b>
              {ins.icon} {ins.title}
            </b>
            <p className="small">{ins.detail}</p>
            <p className="tiny muted">
              Evidence: {ins.evidence} · confidence {ins.confidence}
            </p>
            {ins.suggestion && (
              <div className="row gap wrap">
                <button
                  className="btn btn--sm"
                  onClick={() => {
                    dispatch({ type: 'applySuggestion', suggestion: ins.suggestion!, insightId: ins.id, text: ins.suggestionLabel! });
                    ui.react('flex');
                    ui.toast('Approved — schedule updated from tomorrow');
                  }}
                >
                  ✓ {ins.suggestionLabel}
                </button>
                <button className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'dismissInsight', id: ins.id })}>
                  Not now
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="card">
        <h4>🧠 What HabitPet remembers</h4>
        {state.memory.length === 0 ? (
          <p className="small muted">Nothing yet. Approved goals and preferences show up here — you can delete any of them.</p>
        ) : (
          <ul className="memory">
            {state.memory.map((m) => (
              <li key={m.id}>
                <span className="small">{m.text}</span>
                <small className="muted">{m.at}</small>
                <button className="link small" onClick={() => dispatch({ type: 'forget', id: m.id })}>
                  Forget
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const W = 320;
const H = 120;

function ScoreChart({ hist }: { hist: Snapshot[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = Math.max(hist.length, 7);
  const bw = W / n;
  const y = (v: number) => H - (v / 100) * H;
  const h = hover !== null ? hist[hover] : null;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" role="img" aria-label="Daily score per day">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted)" strokeWidth="2" opacity="0.5" />
          </pattern>
        </defs>
        {[25, 50, 75].map((g) => (
          <line key={g} x1="0" x2={W} y1={y(g)} y2={y(g)} stroke="var(--grid)" strokeWidth="1" />
        ))}
        <line x1="0" x2={W} y1={y(RULES.qualifyingScore)} y2={y(RULES.qualifyingScore)} stroke="var(--good)" strokeDasharray="4 3" strokeWidth="1.5" />
        {hist.map((s, i) => {
          const excluded = s.score === null || s.status === 'rest' || s.status === 'paused';
          const v = excluded ? 100 : Math.max(2, s.score ?? 0);
          const fill = excluded ? 'url(#hatch)' : s.qualifying ? 'var(--accent)' : 'var(--accent-soft)';
          return (
            <g key={s.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <rect x={i * bw} y="0" width={bw} height={H} fill="transparent" />
              <rect x={i * bw + 1} y={y(v)} width={Math.max(1, bw - 2)} height={H - y(v)} rx={Math.min(4, bw / 3)} fill={fill} opacity={hover === null || hover === i ? 1 : 0.55} />
            </g>
          );
        })}
        <text x="0" y={H + 13} fontSize="9" fill="var(--muted)">
          Day 1
        </text>
        <text x={W} y={H + 13} fontSize="9" fill="var(--muted)" textAnchor="end">
          Day {hist.length}
        </text>
      </svg>
      {h && (
        <div className="chart__tip">
          <b>
            Day {h.day + 1} · {WEEKDAYS[h.weekday]}
          </b>
          <span>
            {h.status === 'rest' ? 'Rest day' : h.status === 'paused' ? 'Paused' : h.score === null ? 'Unknown data' : `Score ${h.score}${h.qualifying ? ' ✓ qualifying' : h.missed ? ' · missed' : ''}`}
          </span>
        </div>
      )}
    </div>
  );
}

function ConditionChart({ hist }: { hist: Snapshot[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = Math.max(hist.length - 1, 1);
  const x = (i: number) => (i / n) * W;
  const y = (v: number) => 4 + (H - 8) - (v / 100) * (H - 8);
  const d = hist.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s.condition).toFixed(1)}`).join(' ');
  const h = hover !== null ? hist[hover] : null;
  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Pet condition over time"
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * n));
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[
          { v: 85, l: 'Thriving' },
          { v: 35, l: 'Struggling' },
          { v: 15, l: 'Neglected' },
        ].map((b) => (
          <g key={b.v}>
            <line x1="0" x2={W} y1={y(b.v)} y2={y(b.v)} stroke="var(--grid)" />
            <text x={W - 2} y={y(b.v) - 3} fontSize="8" fill="var(--muted)" textAnchor="end">
              {b.l}
            </text>
          </g>
        ))}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        {h && (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1="0" y2={H} stroke="var(--muted)" strokeWidth="1" />
            <circle cx={x(hover!)} cy={y(h.condition)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>
      {h && (
        <div className="chart__tip">
          <b>Day {h.day + 1}</b>
          <span>
            Condition {Math.round(h.condition)} · {h.conditionState}
          </span>
        </div>
      )}
    </div>
  );
}

function HistoryTable({ hist }: { hist: Snapshot[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Status</th>
            <th>Score</th>
            <th>Cond.</th>
            <th>Streak</th>
            <th>Shield</th>
          </tr>
        </thead>
        <tbody>
          {hist.map((s) => (
            <tr key={s.day}>
              <td>{s.day + 1}</td>
              <td>{s.status}</td>
              <td>{s.score ?? '—'}</td>
              <td>{Math.round(s.condition)}</td>
              <td>{s.streak}</td>
              <td>{s.shield}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
