import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllSubmissionStatus,
  getConsolidatedMarksheet,
  getLeaderboard,
  resetAllEvaluations,
  getJuryEvaluation
} from '../utils/dataStorage';
import { exportToExcel } from '../utils/excelExport';
import { juryProfiles } from '../data/juryData';
import { SOCKET_URL } from '../services/socket';

const fetchSessionSnapshot = async (jury) => {
  const response = await fetch(`${SOCKET_URL}/api/jury/${jury.id}/state`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(`Snapshot failed (${response.status})`);
  }
  const payload = await response.json();
  return { ...payload, jury };
};

export function useAdminData(enabled) {
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [realtimeSessions, setRealtimeSessions] = useState([]);

  const [coreLoading, setCoreLoading] = useState(false);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [realtimeError, setRealtimeError] = useState('');

  const loadCore = useCallback(() => {
    if (!enabled) return;
    setCoreLoading(true);
    try {
      setSubmissionStatus(getAllSubmissionStatus());
      setConsolidatedData(getConsolidatedMarksheet());
      setLeaderboard(getLeaderboard());
    } finally {
      setCoreLoading(false);
    }
  }, [enabled]);

  const loadRealtime = useCallback(async () => {
    if (!enabled) return;
    setRealtimeLoading(true);
    setRealtimeError('');
    try {
      const results = await Promise.allSettled(juryProfiles.map(fetchSessionSnapshot));
      const fulfilled = results
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value);
      setRealtimeSessions(fulfilled);

      if (fulfilled.length !== results.length) {
        setRealtimeError('Some jury sessions could not be loaded.');
      }
    } catch (error) {
      setRealtimeSessions([]);
      setRealtimeError(error.message || 'Unable to load realtime state.');
    } finally {
      setRealtimeLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSubmissionStatus(null);
      setConsolidatedData(null);
      setLeaderboard(null);
      setRealtimeSessions([]);
      return;
    }

    loadCore();
    loadRealtime();
  }, [enabled, loadCore, loadRealtime]);

  const savedEvaluations = useMemo(
    () => submissionStatus?.completed ?? [],
    [submissionStatus]
  );
  const pendingEvaluations = useMemo(
    () => submissionStatus?.pending ?? [],
    [submissionStatus]
  );

  const metrics = useMemo(() => ([
    {
      title: 'Total juries',
      value: submissionStatus?.total ?? '—',
      helper: 'Registered evaluators',
      accent: 'bg-sky-400'
    },
    {
      title: 'Saved drafts',
      value: submissionStatus?.submitted ?? '—',
      helper: 'Evaluations with local backups',
      accent: 'bg-emerald-400'
    },
    {
      title: 'Completion',
      value: submissionStatus ? `${submissionStatus.completionPercentage}%` : '—',
      helper: `${savedEvaluations.length}/${submissionStatus?.total ?? '—'} completed`,
      accent: 'bg-orange-400'
    }
  ]), [submissionStatus, savedEvaluations.length]);

  const downloadConsolidated = useCallback(() => {
    if (!consolidatedData) return;
    const payload = {
      consolidated: true,
      teams: consolidatedData.teams,
      juries: consolidatedData.juries,
      criteria: consolidatedData.criteria,
      generatedAt: consolidatedData.generatedAt
    };
    exportToExcel(payload, 'admin-consolidated');
  }, [consolidatedData]);

  const downloadIndividual = useCallback((juryId) => {
    const juryEvaluation = getJuryEvaluation(juryId);
    if (juryEvaluation && juryEvaluation.isSubmitted) {
      const juryMeta = juryProfiles.find((jury) => jury.id === juryId);
      exportToExcel(
        {
          scores: juryEvaluation.scores,
          jury: juryMeta,
          submittedAt: juryEvaluation.submittedAt
        },
        juryId
      );
    } else {
      const juryMeta = juryProfiles.find((jury) => jury.id === juryId);
      window.alert(`${juryMeta?.name ?? 'This jury'} hasn't saved any evaluation data yet.`);
    }
  }, []);

  const downloadAllIndividuals = useCallback(() => {
    if (!savedEvaluations.length) {
      window.alert('No completed evaluations to download.');
      return;
    }

    let downloadCount = 0;
    savedEvaluations.forEach((jury) => {
      const evaluation = getJuryEvaluation(jury.id);
      if (evaluation && evaluation.isSubmitted) {
        setTimeout(
          () =>
            exportToExcel(
              {
                scores: evaluation.scores,
                jury,
                submittedAt: evaluation.submittedAt
              },
              jury.id
            ),
          downloadCount * 400
        );
        downloadCount += 1;
      }
    });

    window.alert(`Downloading ${downloadCount} individual marksheets...`);
  }, [savedEvaluations]);

  const resetData = useCallback(() => {
    if (window.confirm('Reset all evaluation data? This cannot be undone.')) {
      resetAllEvaluations();
      loadCore();
    }
  }, [loadCore]);

  const refreshCore = useCallback(() => {
    loadCore();
  }, [loadCore]);

  const refreshRealtime = useCallback(() => {
    loadRealtime();
  }, [loadRealtime]);

  const refreshAll = useCallback(() => {
    loadCore();
    loadRealtime();
  }, [loadCore, loadRealtime]);

  return {
    metrics,
    savedEvaluations,
    pendingEvaluations,
    consolidatedData,
    leaderboard,
    leaderboardTeams: leaderboard?.teams ?? [],
    leaderboardMeta: {
      generatedAt: leaderboard?.generatedAt,
      totalTeams: leaderboard?.totalTeams ?? 0
    },
    realtime: {
      sessions: realtimeSessions,
      loading: realtimeLoading,
      error: realtimeError
    },
    coreLoading,
    downloadConsolidated,
    downloadIndividual,
    downloadAllIndividuals,
    resetData,
    refreshCore,
    refreshRealtime,
    refreshAll,
    consolidatedAvailable: Boolean(consolidatedData)
  };
}
