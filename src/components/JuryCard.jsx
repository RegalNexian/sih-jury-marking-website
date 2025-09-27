import { Link } from 'react-router-dom';

function JuryCard({ jury }) {
  const initials = jury.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-950/40 transition duration-300 hover:-translate-y-1 hover:border-orange-400">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_65%)] opacity-0 transition-opacity duration-300 hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative z-10 p-6">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-slate-800 text-lg font-semibold text-orange-200 shadow-lg shadow-orange-500/20">
          {initials}
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white tracking-wide">{jury.name}</h3>
          <p className="text-sm text-slate-400">{jury.designation}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">{jury.department}</p>
        </div>

        <div className="mt-6">
          <Link
            to={`/marking/${jury.id}`}
            className="block w-full rounded-xl border border-orange-400/30 bg-orange-500/10 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-orange-200 transition hover:bg-orange-500/20"
          >
            Start evaluation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default JuryCard;