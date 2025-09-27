import { evaluationCriteria } from '../../data/juryData';

function AdminLeaderboardTable({ teams }) {
  if (!teams?.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-400">
        Leaderboard will populate once evaluations are submitted.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">All teams leaderboard</h2>
        <p className="text-sm text-slate-400">
          Ordered by average score across all submitted jury evaluations.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-inner shadow-slate-950/50">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">Average</th>
              <th className="px-4 py-3 text-center">Juries</th>
              {evaluationCriteria.map((criteria) => (
                <th key={criteria.name} className="px-4 py-3 text-center">{criteria.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {teams.map((team, index) => (
              <tr key={team.id} className="hover:bg-slate-900/60 transition">
                <td className="px-4 py-3 text-sm text-slate-400">#{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{team.name}</div>
                  <div className="text-xs text-slate-500">Total: {team.totalScore}</div>
                </td>
                <td className="px-4 py-3 text-center text-lg font-semibold text-orange-200">
                  {parseFloat(team.averageScore || 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-400">
                  {team.submittedJuries}
                </td>
                {evaluationCriteria.map((criteria) => (
                  <td key={`${team.id}-${criteria.name}`} className="px-4 py-3 text-center text-xs text-slate-300">
                    {parseFloat(team.scores[criteria.name]?.average || 0).toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminLeaderboardTable;
