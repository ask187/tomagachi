import Pet from '../components/Pet';
import { Badge, Meter } from '../components/ui';
import { useStore } from '../state/store';
import type { Branch, Condition, PetColor } from '../engine/types';

// P2 roadmap preview (spec §11) with sample friends. Leaderboard ranks by
// consistency vs. personal goals — never by absolute steps or exercise volume.

const FRIENDS: { name: string; pet: string; color: PetColor; stage: number; cond: Condition; branch: Branch; consistency: number; badge: string; head?: string }[] = [
  { name: 'Priya', pet: 'Biscuit', color: 'mint', stage: 3, cond: 'thriving', branch: 'sage', consistency: 86, badge: '🧘 21-day calm', head: 'headphones' },
  { name: 'Jordan', pet: 'Noodle', color: 'peach', stage: 2, cond: 'stable', branch: 'none', consistency: 71, badge: '💧 Hydro hero', head: 'bow' },
  { name: 'Sam', pet: 'Pixel', color: 'sky', stage: 4, cond: 'thriving', branch: 'athlete', consistency: 92, badge: '👑 Legendary', head: 'crown' },
];

export default function Friends() {
  const { journey, snaps, day, snap } = useStore();
  const last14 = snaps.slice(Math.max(0, day - 13), day + 1).filter((s) => s.status === 'active' || s.status === 'inactive');
  const mine = last14.length ? Math.round((last14.filter((s) => s.qualifying).length / last14.length) * 100) : 0;
  const board = [...FRIENDS.map((f) => ({ name: f.name, v: f.consistency })), { name: 'You', v: mine }].sort((a, b) => b.v - a.v);

  return (
    <div className="screen">
      <div className="row">
        <h2>Friends</h2>
      </div>
      <div className="friends">
        {FRIENDS.map((f) => (
          <div key={f.name} className="friend">
            <Pet color={f.color} stage={f.stage} condition={f.cond} branch={f.branch} head={f.head} size={84} still />
            <b>{f.pet}</b>
            <small>{f.name}</small>
            <Badge>{f.badge}</Badge>
          </div>
        ))}
      </div>

      <div className="card">
        <h4>Consistency leaderboard (14 days)</h4>
        <p className="tiny muted">% of scheduled days that hit each person's own goals — fair across abilities.</p>
        {board.map((b, i) => (
          <div key={b.name} className={`lb ${b.name === 'You' ? 'lb--me' : ''}`}>
            <span>{i + 1}</span>
            <b>{b.name === 'You' ? `You & ${journey.profile.petName}` : b.name}</b>
            <span>{b.v}%</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h4>🤝 Co-op: Team Hydration Week</h4>
        <Meter value={64 + Math.min(20, snap.qualifyingDays)} label="Shared progress" sub="Reward: matching rain-boots for every pet" color="linear-gradient(90deg,#4aa8ff,#3ecf8e)" />
        <p className="tiny muted">If a teammate misses a day, the team goal simply stretches — no one gets blamed.</p>
      </div>
      <p className="tiny muted center">Only opted-in achievements would be shared — never raw health data.</p>
    </div>
  );
}
