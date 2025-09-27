import { Link } from 'react-router-dom';
import StatCard from '../ui/StatCard';

function AdminOverviewTab({
  metrics,
  savedEvaluations,
  pendingEvaluations,
  onDownloadConsolidated,
  onDownloadAllIndividuals,
  onDownloadIndividual,
  onRefresh,
  isLoading
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Evaluation snapshot</h2>
          <p className="text-sm text-slate-400">Current progress across all jury workspaces.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onDownloadConsolidated}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition"
          >
            Download consolidated
          </button>
          <button
            type="button"
            onClick={onDownloadAllIndividuals}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-orange-400/40"
          >
            Download individuals
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-orange-400/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Saved evaluations</h3>
            <span className="text-xs text-slate-500">{savedEvaluations.length} entries</span>
          </div>
          {savedEvaluations.length ? (
            <ul className="space-y-3 text-sm text-slate-200">
              {savedEvaluations.map((jury) => (
                <li key={jury.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{jury.name}</p>
                      <p className="text-xs text-slate-500">{jury.designation}</p>
                      <p className="text-[11px] text-emerald-400">Last saved {new Date(jury.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onDownloadIndividual(jury.id)}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        Download
                      </button>
                      <Link
                        to={`/marking/${jury.id}`}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-center font-semibold text-slate-200 transition hover:border-orange-400/40"
                      >
                        View desk
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No submissions yet.</p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Pending juries</h3>
            <span className="text-xs text-slate-500">{pendingEvaluations.length} entries</span>
          </div>
          {pendingEvaluations.length ? (
            <ul className="space-y-3 text-sm text-slate-200">
              {pendingEvaluations.map((jury) => (
                <li key={jury.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{jury.name}</p>
                      <p className="text-xs text-slate-500">{jury.designation}</p>
                    </div>
                    <Link
                      to={`/marking/${jury.id}`}
                      className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-500/20"
                    >
                      Nudge
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">All juries have started scoring. 🎉</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminOverviewTab;
