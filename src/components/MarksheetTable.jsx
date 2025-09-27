import { useState, useEffect, Fragment } from 'react';
import { teams, evaluationCriteria } from '../data/juryData';

function MarksheetTable({
  onScoreChange,
  onNotesChange,
  initialScores = {},
  initialNotes = {},
  isEditable = true
}) {
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [openTeamId, setOpenTeamId] = useState(null);

  // Initialize scores state with initial scores or empty structure
  useEffect(() => {
    const defaultScores = {};
    teams.forEach(team => {
      defaultScores[team.id] = {};
      evaluationCriteria.forEach(criteria => {
        // Use initial scores if available, otherwise default to 0
        defaultScores[team.id][criteria.name] = 
          initialScores[team.id]?.[criteria.name] || 0;
      });
    });
    setScores(defaultScores);
  }, [initialScores]);

  // Update scores when initialScores prop changes
  useEffect(() => {
    if (Object.keys(initialScores).length > 0) {
      const updatedScores = {};
      teams.forEach(team => {
        updatedScores[team.id] = {};
        evaluationCriteria.forEach(criteria => {
          updatedScores[team.id][criteria.name] = 
            initialScores[team.id]?.[criteria.name] || 0;
        });
      });
      setScores(updatedScores);
    }
  }, [initialScores]);

  useEffect(() => {
    const preparedNotes = {};
    teams.forEach((team) => {
      preparedNotes[team.id] = initialNotes[team.id] ?? '';
    });
    setNotes(preparedNotes);
  }, [initialNotes]);

  // Calculate total for a team
  const calculateTotal = (teamId) => {
    if (!scores[teamId]) return 0;
    return evaluationCriteria.reduce((total, criteria) => {
      return total + (scores[teamId][criteria.name] || 0);
    }, 0);
  };

  // Handle score change
  const handleScoreChange = (teamId, criteriaName, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const criteria = evaluationCriteria.find(c => c.name === criteriaName);
    const finalValue = Math.min(numValue, criteria.maxMarks);

    setScores(prev => {
      const nextScores = {
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [criteriaName]: finalValue
        }
      };
      if (onScoreChange) {
        onScoreChange(nextScores);
      }
      return nextScores;
    });
  };

  const handleNoteChange = (teamId, value) => {
    setNotes((prev) => {
      const nextNotes = {
        ...prev,
        [teamId]: value
      };
      if (onNotesChange) {
        onNotesChange(nextNotes);
      }
      return nextNotes;
    });
  };

  const toggleNote = (teamId) => {
    setOpenTeamId((prev) => (prev === teamId ? null : teamId));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gradient-to-r from-slate-900 to-slate-800">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-200 uppercase tracking-[0.2em] border-b border-slate-700 bg-slate-900">
              TEAM
            </th>
            {evaluationCriteria.map(criteria => (
              <th key={criteria.name} className="px-4 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-[0.2em] border-b border-slate-700 bg-slate-900">
                <div className="flex flex-col items-center gap-1">
                  <span>{criteria.name}</span>
                  <span className="text-[10px] text-orange-300/80">Max {criteria.maxMarks}</span>
                </div>
              </th>
            ))}
            <th className="px-4 py-4 text-center text-xs font-medium text-orange-200 uppercase tracking-[0.2em] border-b border-slate-700 bg-gradient-to-r from-orange-500/15 to-orange-500/5">
              TOTAL
              <div className="text-[10px] text-orange-300/80">Max {evaluationCriteria.reduce((sum, c) => sum + c.maxMarks, 0)}</div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-900/80 divide-y divide-slate-800">
          {teams.map((team, index) => (
            <Fragment key={team.id}>
              <tr className="hover:bg-slate-900/60 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 tracking-wide">{team.name}</div>
                        <div className="text-xs text-slate-500">
                          {(team.members || []).join(', ') || 'No members listed'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNote(team.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-slate-500"
                    >
                      <span className="size-1.5 rounded-full bg-orange-400" aria-hidden="true" />
                      {openTeamId === team.id ? 'Close notes' : 'Notes'}
                    </button>
                  </div>
                </td>
                {evaluationCriteria.map(criteria => (
                  <td key={criteria.name} className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      max={criteria.maxMarks}
                      value={scores[team.id]?.[criteria.name] ?? ''}
                      onChange={(e) => handleScoreChange(team.id, criteria.name, e.target.value)}
                      disabled={!isEditable}
                      className={`w-16 px-2 py-2 text-center border-2 font-semibold rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isEditable
                        ? 'border-slate-700 text-slate-100 bg-slate-900 hover:border-slate-500'
                        : 'border-slate-800 text-slate-500 bg-slate-800 cursor-not-allowed'}
                      `}
                      placeholder="0"
                    />
                  </td>
                ))}
                <td className="px-4 py-4 text-center">
                  <div className="inline-flex px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-200 font-semibold text-lg border border-orange-500/40 shadow-inner">
                    {calculateTotal(team.id)}
                  </div>
                </td>
              </tr>
              {openTeamId === team.id && (
                <tr className="border-t border-slate-800 bg-slate-950/80">
                  <td colSpan={evaluationCriteria.length + 2} className="px-6 pb-6 pt-0">
                    <div className="mt-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-[0.3em]">Workspace notes</h3>
                        <span className="text-[11px] text-slate-500">Private to this device until export</span>
                      </div>
                      <textarea
                        value={notes[team.id] ?? ''}
                        onChange={(e) => handleNoteChange(team.id, e.target.value)}
                        placeholder="Add quick observations, blockers, or follow-up questions for this team."
                        className="w-full min-h-[7rem] resize-y rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MarksheetTable;