import { useMemo } from 'react';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const target = new Date(timestamp).getTime();
  if (Number.isNaN(target)) return '—';
  const diff = Date.now() - target;
  if (diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function AdminRealtimeSummary({ sessions, isLoading, onRefresh, error }) {
  const totalDevices = useMemo(() => {
    if (!Array.isArray(sessions)) return 0;
    return sessions.reduce((acc, session) => acc + (session?.presence?.length || 0), 0);
  }, [sessions]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Realtime presence & sync</h2>
          <p className="text-sm text-slate-400">
            Track connected devices, last updates, and recent sync history for every jury workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-300">
            Devices online: {totalDevices}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-200 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Refreshing…' : 'Refresh' }
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(sessions || []).map((session) => {
          const presence = session?.presence || [];
          const latestHistory = (session?.history || []).slice(0, 3);
          const juryName = session?.jury?.name || `Jury ${session?.juryId}`;

          return (
            <div key={session?.juryId} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{juryName}</h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    ID {session?.juryId}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  {presence.length} online
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <dt>Last update</dt>
                  <dd>{formatRelativeTime(session?.lastUpdated)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Version</dt>
                  <dd>{session?.version ?? 0}</dd>
                </div>
              </dl>

              {presence.length ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Devices</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-200">
                    {presence.map((device) => (
                      <li key={device.socketId || device.clientId} className="flex items-center justify-between gap-3">
                        <span className="truncate" title={device.deviceLabel}>{device.deviceLabel}</span>
                        <span className="text-[10px] text-slate-500">{formatRelativeTime(device.joinedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {latestHistory.length ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Recent sync</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {latestHistory.map((entry, index) => (
                      <li key={`${session?.juryId}-history-${index}`} className="flex items-center justify-between gap-3">
                        <span>{entry.source === 'client' ? 'Client update' : entry.source === 'peer' ? 'Peer update' : entry.source}</span>
                        <span className="text-[10px] text-slate-500">{formatRelativeTime(entry.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AdminRealtimeSummary;
