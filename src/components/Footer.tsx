import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-yt-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-yt-dim sm:flex-row">
        <span>SyncReact — Tus reacciones, en perfecta sincronía</span>
        <Link to="/como-funciona" className="hover:text-white">
          ¿Cómo funciona?
        </Link>
      </div>
    </footer>
  );
}
