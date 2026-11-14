import {
  siAmazon,
  siApplenews,
  siBereal,
  siFacebook,
  siInstagram,
  siNetflix,
  siPinterest,
  siPrimevideo,
  siReddit,
  siRoblox,
  siSnapchat,
  siThreads,
  siTiktok,
  siTinder,
  siTwitch,
  siWhatsapp,
  siX,
  siYoutube,
} from 'simple-icons';

// App logos come from Simple Icons (https://simpleicons.org, CC0). The marks
// remain trademarks of their owners and are shown only to identify each app.
// Apps without an entry fall back to an emoji tile.

type SimpleIcon = { title: string; hex: string; path: string };

const LOGOS: Record<string, SimpleIcon> = {
  instagram: siInstagram,
  tiktok: siTiktok,
  snapchat: siSnapchat,
  facebook: siFacebook,
  x: siX,
  threads: siThreads,
  pinterest: siPinterest,
  bereal: siBereal,
  youtube: siYoutube,
  netflix: siNetflix,
  twitch: siTwitch,
  primevideo: siPrimevideo,
  roblox: siRoblox,
  reddit: siReddit,
  newsapp: siApplenews,
  amazon: siAmazon,
  tinder: siTinder,
  whatsapp: siWhatsapp,
};

export const hasLogo = (id: string) => id in LOGOS;

function isLight(hex: string) {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/** Square app tile: brand logo on its brand colour, or the emoji fallback. */
export default function AppIcon({ id, icon, color, className, children }: { id: string; icon: string; color: string; className?: string; children?: React.ReactNode }) {
  const logo = LOGOS[id];
  if (!logo) {
    return (
      <span className={className} style={{ background: color }}>
        {icon}
        {children}
      </span>
    );
  }
  const bg = logo.hex === '000000' ? '#111111' : `#${logo.hex}`;
  return (
    <span className={`${className ?? ''} app-logo`} style={{ background: bg }} title={logo.title}>
      <svg viewBox="0 0 24 24" role="img" aria-label={logo.title} fill={isLight(logo.hex) ? '#111111' : '#ffffff'}>
        <path d={logo.path} />
      </svg>
      {children}
    </span>
  );
}
