import { useStore } from '../state/store';
import { WEEKDAYS } from '../engine/config';

/** Last 7 days as check dots: qualifying, missed, rest/pause, or today. */
export default function WeekDots() {
  const { snaps, day } = useStore();
  const from = Math.max(0, day - 6);
  const week = snaps.slice(from, day + 1);
  const wins = week.filter((s) => s.qualifying).length;
  return (
    <div className="week card">
      <div className="row">
        <h4>Weekly progress</h4>
        <span className="pill">
          {wins}/{week.length} great days {wins >= 5 ? '⭐' : ''}
        </span>
      </div>
      <div className="week__dots">
        {week.map((s) => {
          const kind = s.day === day ? 'today' : s.qualifying ? 'win' : s.status === 'rest' || s.status === 'paused' || s.score === null ? 'rest' : 'miss';
          return (
            <div key={s.day} className={`week__day week__day--${kind}`} title={`Day ${s.day + 1}: ${kind}`}>
              <small>{WEEKDAYS[s.weekday][0]}</small>
              <i>{kind === 'win' ? '✓' : kind === 'rest' ? '–' : kind === 'today' && s.qualifying ? '✓' : ''}</i>
            </div>
          );
        })}
      </div>
    </div>
  );
}
