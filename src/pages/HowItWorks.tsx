import { Link } from 'react-router-dom';
import {
  Clapperboard,
  Download,
  Link2,
  Play,
  Share2,
  Users,
  Volume2,
  Youtube as YoutubeIcon,
} from 'lucide-react';

const creatorSteps = [
  {
    icon: Clapperboard,
    title: 'Prepara todo',
    text: 'En Grabar, pega el enlace del video musical y activa tu cámara y micrófono.',
  },
  {
    icon: Play,
    title: 'Graba tu reacción',
    text: 'Dale play al video y reacciona. ¿Necesitas pausar, retroceder o adelantar? Hazlo sin miedo: queda registrado automáticamente.',
  },
  {
    icon: Download,
    title: 'Descarga tus archivos',
    text: 'Al detener la grabación se descargan dos archivos: tu reacción en video y un pequeño archivo .sync con los momentos exactos de cada pausa y salto.',
  },
  {
    icon: YoutubeIcon,
    title: 'Súbelo a YouTube',
    text: 'Publica el video de tu reacción en tu canal, como cualquier otro video.',
  },
  {
    icon: Link2,
    title: 'Genera tu enlace',
    text: 'En Publicar, pega el enlace del video musical, el de tu reacción y carga el archivo .sync. Obtendrás un enlace único listo para compartir.',
  },
];

const viewerSteps = [
  {
    icon: Play,
    text: 'Abre el enlace y dale play a la reacción. Nada más.',
  },
  {
    icon: Users,
    text: 'El video musical arranca solo, en el momento justo, y sigue cada pausa y cada salto.',
  },
  {
    icon: Volume2,
    text: '¿No se escucha la música? Se activa con el botón de altavoz sobre el video musical.',
  },
];

const faqs = [
  {
    q: '¿Tengo que instalar algo?',
    a: 'No. Todo funciona en tu navegador. Para grabar se recomienda una computadora con Chrome, Firefox o Edge.',
  },
  {
    q: '¿Dónde se guardan mis videos?',
    a: 'Nada se sube a ningún servidor: la grabación se descarga directo a tu computadora y los datos de sincronización viajan dentro del enlace que compartes.',
  },
  {
    q: '¿Por qué el video musical empieza silenciado?',
    a: 'Porque normalmente tu voz y la música ya se escuchan dentro de la reacción. Si prefieres escuchar el audio original, hay un botón de altavoz para activarlo.',
  },
  {
    q: '¿Puedo editar mi reacción antes de subirla?',
    a: 'Sí, siempre que no cortes ni agregues segmentos: si cambia la duración del video, la sincronización se pierde.',
  },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Cómo funciona</h1>
      <p className="mt-2 text-sm leading-relaxed text-yt-dim">
        SyncReact graba tu reacción junto con los momentos exactos en que pausas o saltas el video
        original. Así, quien vea tu enlace vive la misma experiencia que viviste tú.
      </p>

      {/* CREADORES */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Para creadores</h2>
        <ol className="mt-4 space-y-3">
          {creatorSteps.map((step, i) => (
            <li key={step.title} className="card flex gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yt-red/15 text-yt-red">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">
                  <span className="mr-1.5 text-yt-dim">{i + 1}.</span>
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-yt-dim">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ESPECTADORES */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Para quienes ven tu reacción</h2>
        <ul className="mt-4 space-y-3">
          {viewerSteps.map((step, i) => (
            <li key={i} className="card flex items-center gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-400/15 text-sky-400">
                <step.icon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-yt-dim">{step.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">Preguntas frecuentes</h2>
        <div className="mt-4 space-y-2">
          {faqs.map((faq) => (
            <details key={faq.q} className="card group p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {faq.q}
                  <span className="text-yt-dim transition group-open:rotate-180">▾</span>
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-yt-dim">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card mt-10 flex flex-col items-center gap-4 p-6 text-center">
        <p className="text-lg font-bold">¿Listo para tu primera reacción?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/record" className="btn-primary">
            <Clapperboard className="h-4 w-4" />
            Grabar mi reacción
          </Link>
          <Link to="/upload" className="btn-ghost">
            <Share2 className="h-4 w-4" />
            Publicar
          </Link>
        </div>
      </section>
    </div>
  );
}
