function StatCard({ title, value, helper, accent = 'bg-orange-400' }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-5 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        <span>{title}</span>
        <span className={`inline-flex size-2 rounded-full ${accent}`} aria-hidden="true" />
      </div>
      <div className="text-2xl font-semibold text-white mt-3">{value}</div>
      {helper && <div className="text-xs text-slate-400 mt-2">{helper}</div>}
    </div>
  );
}

export default StatCard;
