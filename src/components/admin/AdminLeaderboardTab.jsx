import AdminLeaderboardTable from './AdminLeaderboardTable';

function AdminLeaderboardTab({ teams, generatedAt, totalTeams }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-white">Event leaderboard</h2>
        <p className="text-sm text-slate-400">
          Rankings based on average scores from all submitted jury evaluations.
        </p>
        {generatedAt ? (
          <p className="text-xs text-slate-500">
            Generated {new Date(generatedAt).toLocaleString()} • {totalTeams} teams
          </p>
        ) : null}
      </div>

      <AdminLeaderboardTable teams={teams} />
    </div>
  );
}

export default AdminLeaderboardTab;
