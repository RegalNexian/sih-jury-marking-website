import AdminRealtimeSummary from './AdminRealtimeSummary';

function AdminRealtimeTab({ sessions, isLoading, error, onRefresh }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Realtime presence & sync</h2>
        <p className="text-sm text-slate-400">
          Monitor connected devices, last updates, and sync history for each jury workspace.
        </p>
      </div>

      <AdminRealtimeSummary
        sessions={sessions}
        isLoading={isLoading}
        error={error}
        onRefresh={onRefresh}
      />
    </div>
  );
}

export default AdminRealtimeTab;
