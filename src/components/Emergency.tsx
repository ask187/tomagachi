import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import {
  EMERGENCY,
  REASONS,
  approvalCode,
  checkCode,
  makeContact,
  requestMessage,
  requestsInLastDay,
  validateRequest,
  withExpiry,
  type EmergencyRequest,
  type ReasonKind,
} from '../engine/emergency';
import { PROTECTED_APPS, resolveApps } from '../engine/apps';
import { Badge, Modal } from './ui';

function copy(text: string, done: (ok: boolean) => void) {
  try {
    navigator.clipboard.writeText(text).then(
      () => done(true),
      () => done(false),
    );
  } catch {
    done(false);
  }
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString();
};

// ---------------------------------------------------------------------------
// Setup card: invite a recovery contact, see request history
// ---------------------------------------------------------------------------
export function RecoveryContactCard() {
  const { journey, dispatch, state } = useStore();
  const contact = journey.profile.recovery;
  const [name, setName] = useState('');
  const [reach, setReach] = useState('');
  const [relation, setRelation] = useState('');
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const history = useMemo(() => withExpiry(state.emergency), [state.emergency]);

  const set = (recovery: typeof contact) => dispatch({ type: 'profile', patch: { recovery } });

  if (!contact) {
    return (
      <div className="card">
        <h4>🤝 Recovery contact</h4>
        <p className="small">
          Pick someone you trust. If you ever need a shielded app for a real reason, you ask them — they read your reason and decide. If they approve, they give you a one-time code.
        </p>
        <div className="form">
          <label>
            Their name
            <input id="rc-name" value={name} maxLength={24} placeholder="e.g. Sam" onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Phone or email
            <input id="rc-reach" value={reach} maxLength={60} placeholder="How you'll reach them" onChange={(e) => setReach(e.target.value)} />
          </label>
          <label>
            Relationship
            <input id="rc-rel" value={relation} maxLength={24} placeholder="e.g. Sister, partner, friend" onChange={(e) => setRelation(e.target.value)} />
          </label>
          <button className="btn" disabled={!name.trim() || !reach.trim()} onClick={() => set(makeContact(name, reach, relation || 'Friend'))}>
            Create invite
          </button>
        </div>
        <p className="tiny muted">They're only asked when you request emergency access. They never see your health data.</p>
      </div>
    );
  }

  const invite = `Hi ${contact.name}! I'm using HabitPet to cut down on scrolling. Would you be my recovery contact? If I ever need a locked app for a real reason, I'll send you a request and you decide. Invite code: ${contact.inviteCode}`;

  return (
    <div className="card">
      <div className="row">
        <h4>🤝 Recovery contact</h4>
        <Badge tone={contact.status === 'active' ? 'good' : 'warn'}>{contact.status === 'active' ? 'Active' : 'Invite pending'}</Badge>
      </div>
      <div className="contact">
        <span className="contact__avatar">{contact.name.charAt(0).toUpperCase()}</span>
        <div>
          <b>{contact.name}</b>
          <small className="muted">
            {contact.relation} · {contact.reach}
          </small>
        </div>
      </div>

      {contact.status === 'invited' && (
        <>
          <p className="small">Send them this invite. Once they accept, emergency access is ready.</p>
          <pre className="msg">{invite}</pre>
          <div className="row gap wrap">
            <button className="btn btn--sm btn--ghost" onClick={() => copy(invite, (ok) => setCopied(ok ? 'invite' : 'fail'))}>
              {copied === 'invite' ? 'Copied ✓' : 'Copy invite'}
            </button>
            <button className="btn btn--sm" onClick={() => set({ ...contact, status: 'active', since: Date.now() })}>
              {contact.name} accepted <Badge tone="sim">demo</Badge>
            </button>
          </div>
          {copied === 'fail' && <p className="tiny muted">Couldn't copy here — select the text above instead.</p>}
          <p className="tiny muted">In the phone app this happens automatically when they open the invite link.</p>
        </>
      )}

      {history.length > 0 && (
        <>
          <div className="label">Emergency requests</div>
          <ul className="history">
            {history.slice(0, 6).map((r) => (
              <li key={r.id}>
                <span>{REASONS.find((x) => x.id === r.reason)?.icon}</span>
                <div>
                  <b className="small">{REASONS.find((x) => x.id === r.reason)?.label}</b>
                  <small className="muted">
                    “{r.detail}” · {ago(r.at)}
                  </small>
                  {r.note && <small className="muted">Note from {contact.name}: {r.note}</small>}
                </div>
                <Badge tone={r.status === 'approved' ? 'good' : r.status === 'denied' ? 'sim' : 'neutral'}>{r.status === 'approved' ? `${r.approvedMinutes} min ✓` : r.status}</Badge>
              </li>
            ))}
          </ul>
        </>
      )}

      {!removing ? (
        <button className="link small" onClick={() => setRemoving(true)}>
          Change or remove contact
        </button>
      ) : (
        <div className="row gap wrap">
          <span className="small">Remove {contact.name}?</span>
          <button
            className="btn btn--sm btn--danger"
            onClick={() => {
              set(undefined);
              setRemoving(false);
            }}
          >
            Remove
          </button>
          <button className="btn btn--sm btn--ghost" onClick={() => setRemoving(false)}>
            Keep
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The request flow, opened from a locked app
// ---------------------------------------------------------------------------
type Step = 'form' | 'pending' | 'denied' | 'done';

export function EmergencyRequestFlow({ open, onClose, onUnlocked }: { open: boolean; onClose: () => void; onUnlocked: (minutes: number) => void }) {
  const { journey, state, dispatch } = useStore();
  const contact = journey.profile.recovery;
  const shielded = resolveApps(journey.profile.shield.apps, journey.profile.shield.custom);
  const list = useMemo(() => withExpiry(state.emergency), [state.emergency]);
  const open_ = list.find((r) => r.status === 'pending' || (r.status === 'approved' && !r.usedAt));
  const [reqId, setReqId] = useState<string | null>(null);
  const req = list.find((r) => r.id === reqId) ?? null;
  const [reason, setReason] = useState<ReasonKind | null>(null);
  const [detail, setDetail] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [contactView, setContactView] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReqId(open_?.id ?? null);
    setCode('');
    setCodeError(false);
    setError(null);
  }, [open]);

  if (!open || !contact) return null;

  const step: Step = !req ? 'form' : req.status === 'denied' ? 'denied' : req.usedAt ? 'done' : req.status === 'pending' || req.status === 'approved' ? 'pending' : 'form';
  const used = requestsInLastDay(list);

  const submit = () => {
    const err = validateRequest(reason, detail, minutes, used);
    setError(err);
    if (err) return;
    const r: EmergencyRequest = { id: `R${Date.now().toString(36).toUpperCase().slice(-6)}`, at: Date.now(), reason: reason!, detail: detail.trim(), minutes, apps: journey.profile.shield.apps, status: 'pending' };
    dispatch({ type: 'emergencyCreate', request: r });
    setReqId(r.id);
    setReason(null);
    setDetail('');
  };

  const redeem = () => {
    if (!req) return;
    if (checkCode(contact.key, req, code)) {
      dispatch({ type: 'emergencyUpdate', id: req.id, patch: { usedAt: Date.now() } });
      onUnlocked(req.approvedMinutes!);
    } else setCodeError(true);
  };

  const msg = req ? requestMessage(journey.profile.petName, contact, req, shielded.map((a) => a.name)) : '';

  return (
    <Modal open onClose={onClose} title="🚨 Emergency access">
      {contact.status !== 'active' ? (
        <p className="small">
          {contact.name} hasn't accepted your invite yet. Until they do, use a recovery mission or the regular override. Calls, SOS, messages and maps are always open.
        </p>
      ) : (
        <>
          <div className="essentials-note">
            <b>Real emergency?</b> Calls, SOS, messages and maps are never locked:
            <div className="chips">
              {PROTECTED_APPS.slice(0, 4).map((a) => (
                <span key={a.id} className="chip chip--static">
                  {a.icon} {a.name}
                </span>
              ))}
            </div>
          </div>

          {step === 'form' && (
            <div className="form">
              <p className="small">
                Ask <b>{contact.name}</b> to open your shielded apps. Explain why — {contact.name} decides if it's a valid reason.
              </p>
              <div className="label">Reason</div>
              <div className="reasons">
                {REASONS.map((r) => (
                  <button key={r.id} className={`reason ${reason === r.id ? 'on' : ''}`} onClick={() => setReason(r.id)} aria-pressed={reason === r.id}>
                    <span>{r.icon}</span>
                    <b>{r.label}</b>
                  </button>
                ))}
              </div>
              {reason && <p className="tiny muted">{REASONS.find((r) => r.id === reason)!.hint}</p>}
              <label>
                What's going on?
                <textarea id="em-detail" rows={3} maxLength={280} value={detail} placeholder="Explain in a sentence or two" onChange={(e) => setDetail(e.target.value)} />
                <small className="muted">{detail.trim().length}/{EMERGENCY.minDetail}+ characters</small>
              </label>
              <div className="label">How long?</div>
              <div className="chips">
                {EMERGENCY.durations.map((d) => (
                  <button key={d} className={`chip ${minutes === d ? 'on' : ''}`} onClick={() => setMinutes(d)}>
                    {d < 60 ? `${d} min` : `${d / 60} h`}
                  </button>
                ))}
              </div>
              <p className="tiny muted">
                Unlocks: {shielded.map((a) => a.name).join(', ') || 'your shielded apps'} · {EMERGENCY.maxPerDay - used} of {EMERGENCY.maxPerDay} requests left today
              </p>
              {error && <p className="small error">{error}</p>}
              <button className="btn btn--block" onClick={submit}>
                Send request to {contact.name}
              </button>
            </div>
          )}

          {step === 'pending' && req && (
            <div className="form">
              <div className={`req-status ${req.status === 'approved' ? 'req-status--ok' : ''}`}>
                {req.status === 'pending' ? `⏳ Waiting for ${contact.name} to decide…` : `✅ ${contact.name} approved ${req.approvedMinutes} min. Enter the code they gave you.`}
              </div>
              <pre className="msg">{msg}</pre>
              <div className="row gap wrap">
                <button className="btn btn--sm btn--ghost" onClick={() => copy(msg, (ok) => setCopied(ok ? 'msg' : 'fail'))}>
                  {copied === 'msg' ? 'Copied ✓' : 'Copy message'}
                </button>
                <span className="tiny muted">Send it by text or call — whatever reaches them fastest.</span>
              </div>
              {copied === 'fail' && <p className="tiny muted">Couldn't copy here — select the text above instead.</p>}

              <label>
                Approval code from {contact.name}
                <input
                  id="em-code"
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError(false);
                  }}
                />
              </label>
              {codeError && <p className="small error">That code doesn't match. Check it with {contact.name} — codes only work after they approve.</p>}
              <button className="btn btn--block" disabled={code.replace(/\D/g, '').length !== 6} onClick={redeem}>
                Unlock
              </button>

              <div className="demo-box">
                <Badge tone="sim">demo</Badge>
                <span className="tiny">Without a server, {contact.name}'s side runs on this device.</span>
                <button className="btn btn--sm btn--ghost" onClick={() => setContactView(true)}>
                  Open {contact.name}'s view
                </button>
              </div>
              <button className="link small" onClick={() => dispatch({ type: 'emergencyUpdate', id: req.id, patch: { status: 'cancelled' } })}>
                Cancel request
              </button>
            </div>
          )}

          {step === 'denied' && req && (
            <div className="form">
              <div className="req-status req-status--no">
                {contact.name} said no this time.
                {req.note && (
                  <>
                    <br />“{req.note}”
                  </>
                )}
              </div>
              <p className="small">No penalty. A quick recovery mission still unlocks your apps.</p>
              <button className="btn btn--block" onClick={() => setReqId(null)}>
                Send a different request
              </button>
            </div>
          )}

          {step === 'done' && req && (
            <div className="form center">
              <div className="req-status req-status--ok">🔓 Unlocked for {req.approvedMinutes} min. Take care of what you need.</div>
              <button className="btn btn--block" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </>
      )}
      {contactView && req && <ContactView req={req} onClose={() => setContactView(false)} />}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// What the recovery contact sees (demo: on the same device)
// ---------------------------------------------------------------------------
function ContactView({ req, onClose }: { req: EmergencyRequest; onClose: () => void }) {
  const { journey, dispatch } = useStore();
  const contact = journey.profile.recovery!;
  const [mins, setMins] = useState(req.minutes);
  const [note, setNote] = useState('');
  const [denying, setDenying] = useState(false);
  const reason = REASONS.find((r) => r.id === req.reason)!;
  const apps = resolveApps(req.apps, journey.profile.shield.custom);

  return (
    <div className="contact-view" role="dialog" aria-label={`${contact.name}'s recovery-contact view`}>
      <div className="contact-view__card">
        <div className="contact-view__head">
          <small>{contact.name}'s phone · recovery contact</small>
          <button className="icon-btn" onClick={onClose} aria-label="Close contact view">
            ✕
          </button>
        </div>
        <h3>{journey.profile.petName}'s human is asking for emergency access</h3>
        <div className="contact-view__req">
          <b>
            {reason.icon} {reason.label}
          </b>
          <p>“{req.detail}”</p>
          <small className="muted">
            Wants {req.minutes} min of {apps.map((a) => a.name).join(', ') || 'shielded apps'} · {ago(req.at)}
          </small>
        </div>

        {req.status === 'pending' && !denying && (
          <>
            <p className="tiny muted">Is this a valid reason? You can approve less time than asked.</p>
            <div className="chips">
              {EMERGENCY.durations
                .filter((d) => d <= req.minutes)
                .map((d) => (
                  <button key={d} className={`chip ${mins === d ? 'on' : ''}`} onClick={() => setMins(d)}>
                    {d < 60 ? `${d} min` : `${d / 60} h`}
                  </button>
                ))}
            </div>
            <div className="row gap">
              <button className="btn btn--ghost grow" onClick={() => setDenying(true)}>
                Not valid
              </button>
              <button className="btn grow" onClick={() => dispatch({ type: 'emergencyUpdate', id: req.id, patch: { status: 'approved', approvedMinutes: mins, decidedAt: Date.now() } })}>
                Approve {mins < 60 ? `${mins} min` : `${mins / 60} h`}
              </button>
            </div>
          </>
        )}

        {req.status === 'pending' && denying && (
          <div className="form">
            <label>
              Note for them (optional)
              <input id="cv-note" value={note} maxLength={120} placeholder="e.g. Call me instead, I'll pass it on" onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="row gap">
              <button className="btn btn--ghost grow" onClick={() => setDenying(false)}>
                Back
              </button>
              <button
                className="btn btn--danger grow"
                onClick={() => {
                  dispatch({ type: 'emergencyUpdate', id: req.id, patch: { status: 'denied', note: note.trim() || undefined, decidedAt: Date.now() } });
                  onClose();
                }}
              >
                Decline request
              </button>
            </div>
          </div>
        )}

        {req.status === 'approved' && (
          <div className="center">
            <p className="small">Approved. Give them this code:</p>
            <div className="code">{approvalCode(contact.key, req.id, req.approvedMinutes!)}</div>
            <p className="tiny muted">It only works for this request and for {req.approvedMinutes} min.</p>
            <button className="btn btn--sm btn--ghost" onClick={onClose}>
              Back to {journey.profile.petName}'s app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
