function ConfigBackupPanel({ onExport, onImport }) {
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result ?? '{}');
        onImport(parsed);
      } catch (error) {
        window.alert(`Error reading configuration file: ${error.message || 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Backup & restore</h2>
        <p className="text-sm text-slate-400">Export the current configuration as JSON or import a previous snapshot.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-blue-500/30 transition"
        >
          Download config
        </button>
        <label className="relative inline-flex cursor-pointer items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500/20">
          <input type="file" accept="application/json" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={handleFileSelect} />
          Upload config
        </label>
      </div>
      <p className="text-xs text-slate-500">Tip: Always export the existing configuration before making major changes.</p>
    </section>
  );
}

export default ConfigBackupPanel;
