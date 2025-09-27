function ConfigSessionSection({ session, onUpdate }) {
  const fields = [
    { key: 'year', label: 'Hackathon Year', placeholder: '2025' },
    { key: 'title', label: 'Title', placeholder: 'INTERNAL HACKATHON' },
    { key: 'subtitle', label: 'Subtitle', placeholder: 'for Smart India Hackathon' },
    { key: 'organization', label: 'Organization', placeholder: 'Parala Maharaja Engineering College' },
    { key: 'organizationShort', label: 'Organization Short Name', placeholder: 'PMEC' },
    { key: 'logoPath', label: 'Logo Path', placeholder: '/pmec-logo.png' }
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Session details</h2>
        <p className="text-sm text-slate-400">
          Update the information displayed across the evaluator and admin portals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {fields.map(({ key, label, placeholder }) => (
          <label key={key} className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</span>
            <input
              type="text"
              value={session[key] ?? ''}
              placeholder={placeholder}
              onChange={(event) => onUpdate(key, event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export default ConfigSessionSection;
