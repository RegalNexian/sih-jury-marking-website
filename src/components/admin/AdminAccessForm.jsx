function AdminAccessForm({ credentials, onChange, onSubmit, isSubmitting, error }) {
  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-white">Admin access required</h2>
        <p className="text-sm text-slate-400">Enter the daily credentials to unlock the control panel.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="admin-id">
          Admin ID
        </label>
        <input
          id="admin-id"
          name="id"
          value={credentials.id}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          placeholder="Enter admin ID"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          value={credentials.password}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Verifying…' : 'Unlock dashboard'}
      </button>
    </form>
  );
}

export default AdminAccessForm;
