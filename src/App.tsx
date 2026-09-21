import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Record from './pages/Record';
import Upload from './pages/Upload';
import Watch from './pages/Watch';

function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-yt-red">404</p>
      <p className="mt-3 text-lg font-semibold">Página no encontrada</p>
      <p className="mt-1 text-sm text-yt-dim">El enlace no existe o fue escrito incorrectamente.</p>
      <Link to="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-yt-bg text-yt-text">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/como-funciona" element={<HowItWorks />} />
            <Route path="/record" element={<Record />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
