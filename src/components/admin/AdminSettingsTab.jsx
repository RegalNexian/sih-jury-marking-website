function AdminSettingsTab({ onResetData, onRefreshAll }) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">System maintenance</h2>
        <p className="text-sm text-slate-400">
          Export archives frequently and only reset data once evaluations are officially closed.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-lg shadow-slate-950/40">
        <div className="space-y-2 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">Reset evaluations</h3>
          <p>
            This permanently clears every saved score, note, and draft across all juries. Only proceed after exporting final scorecards.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetData}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:bg-red-500/20"
        >
          Reset all evaluation data
        </button>
      </div>

      <button
        type="button"
        onClick={onRefreshAll}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-orange-400/40"
      >
        Refresh dashboards
      </button>
    </div>
  );
}

export default AdminSettingsTab;
