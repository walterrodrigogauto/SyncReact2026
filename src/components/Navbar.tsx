import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Clapperboard, Home, Play, Share2 } from 'lucide-react';

const links = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/como-funciona', label: 'Cómo funciona', icon: BookOpen },
  { to: '/record', label: 'Grabar', icon: Clapperboard },
  { to: '/upload', label: 'Publicar', icon: Share2 },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-yt-border bg-yt-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="SyncReact — Inicio">
          <span className="grid h-[22px] w-8 place-items-center rounded-[6px] bg-yt-red">
            <Play className="h-3 w-3 fill-white text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">SyncReact</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-yt-elevated text-white'
                    : 'text-yt-dim hover:bg-yt-elevated/60 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
