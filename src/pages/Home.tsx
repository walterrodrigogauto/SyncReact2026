import { Link } from 'react-router-dom';
import { ArrowRight, Clapperboard, Share2, Users } from 'lucide-react';

const steps = [
  {
    icon: Clapperboard,
    title: 'Graba tu reacción',
    text: 'Activa la cámara, pon el video musical y reacciona. Pausa o salta el video cuando quieras.',
    to: '/record',
  },
  {
    icon: Share2,
    title: 'Publica el enlace',
    text: 'Sube tu reacción a YouTube y genera un enlace único para compartir, con un clic.',
    to: '/upload',
  },
  {
    icon: Users,
    title: 'Todos lo ven sincronizado',
    text: 'Quien abra tu enlace verá tu reacción junto al video original, siempre en el momento justo.',
    to: '/como-funciona',
  },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-yt-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center lg:py-28">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Tus reacciones de YouTube, en <span className="text-yt-red">perfecta sincronía</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-yt-dim sm:text-lg">
            Graba tu reacción mientras ves el video original y comparte un enlace donde ambos videos
            se reproducen juntos, sin editar nada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/record" className="btn-primary">
              <Clapperboard className="h-4 w-4" />
              Comenzar a grabar
            </Link>
            <Link to="/como-funciona" className="btn-ghost">
              Cómo funciona
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PASOS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight">Tres pasos, cero complicaciones</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-yt-red/15 text-yt-red">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-yt-dim">{step.text}</p>
              <Link
                to={step.to}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-yt-red hover:underline"
              >
                {step.to === '/record'
                  ? 'Grabar ahora'
                  : step.to === '/upload'
                    ? 'Publicar ahora'
                    : 'Ver más detalles'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
