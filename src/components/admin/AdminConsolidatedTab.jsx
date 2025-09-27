function AdminConsolidatedTab({ onDownloadConsolidated, hasData, generatedAt }) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-semibold text-white">Consolidated marksheet</h2>
      <p className="text-sm text-slate-400">
        Export the full cross-judge marksheet for archival or publishing.
      </p>
      {generatedAt ? (
        <p className="text-xs text-slate-500">Last generated {new Date(generatedAt).toLocaleString()}</p>
      ) : null}
      <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">
          The export includes every team, each jury's score breakdown, and aggregated totals.
        </p>
        <button
          type="button"
          onClick={onDownloadConsolidated}
          disabled={!hasData}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasData ? 'Download consolidated marksheet' : 'No data available yet'}
        </button>
      </div>
    </div>
  );
}

export default AdminConsolidatedTab;
