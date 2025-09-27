function HeroHeader({
  title,
  subtitle,
  kicker,
  description,
  actions,
  eyebrow,
  accent = 'from-orange-500/40 via-orange-500/10 to-transparent'
}) {
  return (
    <section className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_65%)]`} aria-hidden="true" />
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} aria-hidden="true" />
      <div className="relative container mx-auto px-4 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900/70 border border-orange-500/30 text-orange-300 text-xs font-semibold uppercase tracking-[0.3em]">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-orange-200/80 font-medium tracking-wide">
              {subtitle}
            </p>
          )}
          {kicker && (
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{kicker}</p>
          )}
          {description && (
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              {description}
            </p>
          )}
          {actions && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroHeader;
