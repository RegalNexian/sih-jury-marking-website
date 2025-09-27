function GuidelineCard({ title, icon, items }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-lg shadow-slate-950/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center text-xl">
          {icon}
        </div>
        <h3 className="text-slate-100 font-semibold text-lg">{title}</h3>
      </div>
      <ul className="space-y-3 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-orange-400" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GuidelineCard;
