import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarksheetTable from '../components/MarksheetTable';
import { juryProfiles, teams, evaluationCriteria } from '../data/juryData';
import { saveJuryEvaluation, getJuryEvaluation } from '../utils/dataStorage';
import { useRealtimeScores, CONNECTION_STATUS } from '../hooks/useRealtimeScores';
import PageLayout from '../components/layout/PageLayout';
import HeroHeader from '../components/ui/HeroHeader';
import GuidelineCard from '../components/ui/GuidelineCard';

function MarkingPage() {
  const { juryId } = useParams();
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const remoteUpdateRef = useRef(false);
  const hasInitializedDraftRef = useRef(false);

  // Find jury information
  const jury = juryProfiles.find(j => j.id === parseInt(juryId));

  const normalizeNotes = useCallback((incomingNotes = {}) => {
    const base = {};
    teams.forEach((team) => {
      base[team.id] = incomingNotes[team.id] ?? '';
    });
    return base;
  }, []);

  useEffect(() => {
    setNotes(normalizeNotes({}));
  }, [normalizeNotes]);

  // Load existing evaluation data
  useEffect(() => {
    if (jury) {
      const existingEvaluation = getJuryEvaluation(parseInt(juryId));
      if (existingEvaluation) {
        setScores(existingEvaluation.scores);
        setLastSaved(existingEvaluation.submittedAt);
        setNotes(normalizeNotes(existingEvaluation.notes));
        hasInitializedDraftRef.current = Boolean(existingEvaluation.isSubmitted);
      } else {
        setScores({});
        setLastSaved(null);
        setNotes(normalizeNotes({}));
        hasInitializedDraftRef.current = false;
      }
    }
  }, [juryId, jury, normalizeNotes]);

  const handleScoreChange = (newScores) => {
    setScores(newScores);
  };

  const handleNotesChange = useCallback((updatedNotes) => {
    setNotes(updatedNotes);
  }, []);

  const handleRemoteScores = useCallback((incomingScores) => {
    remoteUpdateRef.current = true;
    setScores(prev => {
      const merged = { ...prev };
      Object.entries(incomingScores || {}).forEach(([teamId, criteriaScores]) => {
        merged[teamId] = {
          ...(merged[teamId] || {}),
          ...(criteriaScores || {})
        };
      });
      return merged;
    });
  }, []);

  const { connectionState, lastAck, lastSync, broadcastScores } = useRealtimeScores({
    juryId: parseInt(juryId),
    onRemoteUpdate: handleRemoteScores
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      await saveJuryEvaluation(parseInt(juryId), {
        scores,
        notes
      });
      setLastSaved(timestamp);
      hasInitializedDraftRef.current = true;
      alert('Evaluation saved successfully! You can modify and save again anytime.');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Error saving evaluation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    try {
      const timestamp = new Date().toISOString();
      await saveJuryEvaluation(parseInt(juryId), {
        scores,
        notes
      });
      setLastSaved(timestamp);
      hasInitializedDraftRef.current = true;
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [juryId, scores, notes]);

  useEffect(() => {
    if (hasInitializedDraftRef.current) return;
    if (!jury) return;
    if (!scores || Object.keys(scores).length === 0) return;

    const hasAnyScore = Object.values(scores).some((criteriaMap) => {
      if (!criteriaMap) return false;
      return Object.values(criteriaMap).some((value) => value !== null && value !== undefined && value !== '');
    });

    const hasAnyNote = Object.values(notes).some((value) => (value ?? '').toString().trim().length > 0);

    if (!hasAnyScore && !hasAnyNote) return;

    const commitInitialDraft = async () => {
      try {
        const timestamp = new Date().toISOString();
        await saveJuryEvaluation(parseInt(juryId), {
          scores,
          notes
        });
        setLastSaved(timestamp);
      } catch (error) {
        console.error('Initial autosave failed:', error);
      } finally {
        hasInitializedDraftRef.current = true;
      }
    };

    commitInitialDraft();
  }, [jury, juryId, scores, notes]);

  // Auto-save when scores change (debounced)
  useEffect(() => {
    const hasScores = Object.keys(scores).length > 0;
    const hasNotes = Object.values(notes).some((value) => (value ?? '').toString().trim().length > 0);
    if (hasScores || hasNotes) {
      const timeoutId = setTimeout(handleAutoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [scores, notes, handleAutoSave]);

  useEffect(() => {
    if (remoteUpdateRef.current) {
      remoteUpdateRef.current = false;
      return;
    }
    if (Object.keys(scores).length === 0) {
      return;
    }

    broadcastScores(scores);
  }, [scores, broadcastScores]);

  const connectionMeta = {
    [CONNECTION_STATUS.CONNECTED]: {
      label: 'Live sync active',
      dot: 'bg-green-400',
      text: 'text-green-200'
    },
    [CONNECTION_STATUS.CONNECTING]: {
      label: 'Connecting…',
      dot: 'bg-amber-400',
      text: 'text-amber-200'
    },
    [CONNECTION_STATUS.DISCONNECTED]: {
      label: 'Offline mode',
      dot: 'bg-red-400',
      text: 'text-red-200'
    }
  };

  const currentConnection = connectionMeta[connectionState] || connectionMeta[CONNECTION_STATUS.DISCONNECTED];

  const formatRelativeTime = useCallback((timestamp) => {
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
  }, []);

  const maxTeamScore = useMemo(
    () => evaluationCriteria.reduce((sum, criteria) => sum + criteria.maxMarks, 0),
    []
  );

  const teamProgress = useMemo(() => {
    return teams.map((team) => {
      const teamScores = scores[team.id] || {};
      const total = evaluationCriteria.reduce(
        (sum, criteria) => sum + (teamScores[criteria.name] || 0),
        0
      );
      const completion = maxTeamScore === 0 ? 0 : total / maxTeamScore;
      return {
        id: team.id,
        name: team.name,
        total,
        completion: Math.max(0, Math.min(1, completion))
      };
    });
  }, [scores, maxTeamScore]);

  const averageCompletion = useMemo(() => {
    if (!teamProgress.length) return 0;
    const sum = teamProgress.reduce((acc, entry) => acc + entry.completion, 0);
    return Math.round((sum / teamProgress.length) * 100);
  }, [teamProgress]);

  const activeTeams = useMemo(
    () => teamProgress.filter((team) => team.total > 0).length,
    [teamProgress]
  );

  const topTeam = useMemo(() => {
    if (!teamProgress.length) return null;
    return teamProgress.reduce((best, entry) => (entry.total > best.total ? entry : best), teamProgress[0]);
  }, [teamProgress]);

  const statusIndicators = [
    {
      label: 'Live status',
      value: currentConnection.label,
      helper:
        connectionState === CONNECTION_STATUS.CONNECTED
          ? `Last sync ${formatRelativeTime(lastSync || lastAck)}`
          : 'Offline edits will sync automatically',
      tone: currentConnection.dot
    },
    {
      label: 'Draft safety',
      value: lastSaved ? formatRelativeTime(lastSaved) : 'No draft yet',
      helper: lastSaved ? `Saved at ${new Date(lastSaved).toLocaleTimeString()}` : 'Manual save creates a backup',
      tone: 'bg-fuchsia-400'
    },
    {
      label: 'Coverage',
      value: `${averageCompletion}%`,
      helper: `${activeTeams}/${teams.length} teams touched`,
      tone: 'bg-sky-400'
    }
  ];

  if (!jury) {
    const heroNotFound = (
      <HeroHeader
        eyebrow="Jury workspace"
        title="Jury not found"
        description="The requested jury profile could not be located. Please return to the panel list and try again."
        actions={[
          <Link
            key="back"
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-semibold shadow-lg shadow-orange-500/40"
          >
            ← Back to panel
          </Link>
        ]}
      />
    );

    return (
      <PageLayout hero={heroNotFound}>
        <section className="container mx-auto px-4 pb-16">
          <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-8 text-center text-slate-300">
            Please choose a valid jury profile to begin scoring.
          </div>
        </section>
      </PageLayout>
    );
  }

  const hero = (
    <HeroHeader
      eyebrow="Jury Workspace"
      title={jury.name}
      subtitle={`${jury.designation} • ${jury.department}`}
      description="Realtime safeguards, autosave backups, and cross-device collaboration keep every evaluation consistent."
      actions={[
        <Link
          key="back"
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-400/30 bg-orange-500/10 text-orange-200/80 hover:text-white transition"
        >
          <span className="text-lg">←</span>
          Back to panel
        </Link>
      ]}
    />
  );

  return (
    <PageLayout hero={hero}>
      <section className="container mx-auto px-4 pb-12">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
              <div className="flex flex-wrap gap-3">
                {statusIndicators.map((indicator) => (
                  <div
                    key={indicator.label}
                    className="flex min-w-[180px] flex-1 items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <span className={`mt-1 size-2 rounded-full ${indicator.tone}`} aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {indicator.label}
                      </p>
                      <p className="text-sm font-semibold text-white">{indicator.value}</p>
                      <p className="text-xs text-slate-500">{indicator.helper}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
                <p>Autosave mirrors every change after a short pause. Manual save locks a backup instantly.</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        Save draft
                      </>
                    )}
                  </button>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-orange-400/40"
                  >
                    <span>←</span>
                    Back to panel
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <aside className="w-full xl:w-80 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/40">
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase mb-4">Session details</h2>
              <dl className="space-y-3 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Judge ID</dt>
                  <dd>{juryId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Teams scored</dt>
                  <dd>{Object.keys(scores).length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Offline safety</dt>
                  <dd>{connectionState === CONNECTION_STATUS.CONNECTED ? 'Synced' : 'Drafting locally'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/40">
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase mb-4">Quick reminder</h2>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex gap-2">
                  <span className="size-1.5 rounded-full bg-orange-400 mt-1" aria-hidden="true" />
                  <span>Autosave keeps drafts locally even when offline.</span>
                </li>
                <li className="flex gap-2">
                  <span className="size-1.5 rounded-full bg-orange-400 mt-1" aria-hidden="true" />
                  <span>Reconnect to push scores automatically.</span>
                </li>
                <li className="flex gap-2">
                  <span className="size-1.5 rounded-full bg-orange-400 mt-1" aria-hidden="true" />
                  <span>Use notes to capture observations before exporting.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="container mx-auto px-4 pb-16">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-orange-500/30 text-orange-300 text-xs font-semibold uppercase tracking-[0.2em]">
              Evaluation matrix
            </span>
            <h2 className="text-4xl font-semibold text-white mt-4 mb-3">
              Precision scoring for every team
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Track rubric performance, monitor coverage, and broadcast updates to the rest of the panel without leaving this workspace.
            </p>
            {connectionState !== CONNECTION_STATUS.CONNECTED && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-red-500/10 border border-red-500/40 text-sm text-red-300">
                <span className="size-2 rounded-full bg-red-400" aria-hidden="true" />
                Live sync offline — edits queue safely and handshake resumes automatically.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.7)] overflow-hidden">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/70">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Realtime marksheet</h3>
                <p className="text-xs text-slate-500">Max per team {maxTeamScore}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                  <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
                  {evaluationCriteria.length} rubric items
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                  <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
                  {teams.length} teams
                </span>
              </div>
            </div>
            <MarksheetTable
              onScoreChange={handleScoreChange}
              onNotesChange={handleNotesChange}
              initialScores={scores}
              initialNotes={notes}
              isEditable
            />
          </div>

          <div className="mt-10 rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Team progress</h2>
              {topTeam && (
                <span className="inline-flex items-center gap-2 text-xs text-orange-300/80 bg-orange-500/10 border border-orange-400/30 px-3 py-1 rounded-full">
                  <span className="size-2 rounded-full bg-orange-400" aria-hidden="true" />
                  Top momentum: {topTeam.name}
                  {maxTeamScore > 0 && ` (${topTeam.total}/${maxTeamScore})`}
                </span>
              )}
            </div>
            {teamProgress.length ? (
              <ul className="mt-6 space-y-4">
                {teamProgress
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((team) => {
                    const width = Math.min(100, Math.round(team.completion * 100));
                    return (
                      <li key={team.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span className="font-medium text-slate-100">{team.name}</span>
                          <span>
                            {team.total}
                            {maxTeamScore > 0 && ` / ${maxTeamScore}`}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Teams will appear here as soon as the event roster is configured.
              </p>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuidelineCard
              title="Evaluation checklist"
              icon="📋"
              items={[
                'Review the team progress panel for missing scores',
                'Respect maximum marks (shown inline)',
                'Totals update automatically as you go'
              ]}
            />
            <GuidelineCard
              title="Collaboration tips"
              icon="🚀"
              items={[
                'Stay connected for automatic syncing when possible',
                'Offline? Keep scoring — drafts sync once back online',
                'Review notes and totals before exporting from admin panel'
              ]}
            />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

export default MarkingPage;