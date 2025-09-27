import { useMemo, useState } from 'react';
import { hackathonConfig, configManager } from '../config/hackathonConfig';
import {
  cleanupJuryEvaluationData,
  cleanupTeamEvaluationData,
  cleanupCriteriaEvaluationData
} from '../utils/dataStorage';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function useConfigData() {
  const [session, setSession] = useState(() => clone(hackathonConfig.session));
  const [juries, setJuries] = useState(() => clone(hackathonConfig.juryMembers));
  const [teams, setTeams] = useState(() => clone(hackathonConfig.teams));
  const [criteria, setCriteria] = useState(() => clone(hackathonConfig.evaluationCriteria));
  const [message, setMessage] = useState(null);

  const updateSession = (fieldOrPatch, value) => {
    const patch =
      typeof fieldOrPatch === 'string' ? { [fieldOrPatch]: value } : { ...fieldOrPatch };
    const updated = { ...session, ...patch };
    setSession(updated);
    configManager.updateSessionInfo(updated);
  };

  const addJury = (payload) => {
    const newJury = configManager.addJuryMember(payload);
    setJuries((prev) => [...prev, newJury]);
    setMessage({ type: 'success', text: 'Jury member added.' });
  };

  const updateJury = (id, updates) => {
    configManager.updateJuryMember(id, updates);
    setJuries((prev) => prev.map((jury) => (jury.id === id ? { ...jury, ...updates } : jury)));
    setMessage({ type: 'success', text: 'Jury details updated.' });
  };

  const toggleJury = (id) => {
    const jury = juries.find((item) => item.id === id);
    if (!jury) return;
    updateJury(id, { isActive: !jury.isActive });
  };

  const deleteJury = (id) => {
    const target = juries.find((item) => item.id === id);
    if (!target) return false;
    if (!window.confirm(`Delete ${target.name}? This removes all related evaluation data.`)) {
      return false;
    }
    const ok = configManager.deleteJuryMember(id);
    if (ok) {
      cleanupJuryEvaluationData(id);
      setJuries((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Jury member deleted.' });
      return true;
    }
    setMessage({ type: 'error', text: 'Unable to delete jury member.' });
    return false;
  };

  const addTeam = (payload) => {
    const newTeam = configManager.addTeam(payload);
    setTeams((prev) => [...prev, newTeam]);
    setMessage({ type: 'success', text: 'Team added.' });
  };

  const updateTeam = (id, updates) => {
    configManager.updateTeam(id, updates);
    setTeams((prev) => prev.map((team) => (team.id === id ? { ...team, ...updates } : team)));
    setMessage({ type: 'success', text: 'Team updated.' });
  };

  const toggleTeam = (id) => {
    const team = teams.find((item) => item.id === id);
    if (!team) return;
    updateTeam(id, { isActive: !team.isActive });
  };

  const deleteTeam = (id) => {
    const target = teams.find((item) => item.id === id);
    if (!target) return false;
    if (!window.confirm(`Delete ${target.name}? This removes all associated scores.`)) {
      return false;
    }
    const ok = configManager.deleteTeam(id);
    if (ok) {
      cleanupTeamEvaluationData(id);
      setTeams((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Team deleted.' });
      return true;
    }
    setMessage({ type: 'error', text: 'Unable to delete team.' });
    return false;
  };

  const addCriteria = (payload) => {
    const nextId = Math.max(0, ...criteria.map((item) => item.id)) + 1;
    const newCriteria = {
      id: nextId,
      ...payload,
      maxMarks: parseInt(payload.maxMarks, 10),
      weight: parseInt(payload.weight ?? 0, 10),
      isActive: true
    };
    hackathonConfig.evaluationCriteria.push(newCriteria);
    setCriteria((prev) => [...prev, newCriteria]);
    setMessage({ type: 'success', text: 'Evaluation criteria added.' });
  };

  const updateCriteria = (id, updates) => {
    configManager.updateEvaluationCriteria(id, updates);
    setCriteria((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setMessage({ type: 'success', text: 'Criteria updated.' });
  };

  const toggleCriteria = (id) => {
    const item = criteria.find((entry) => entry.id === id);
    if (!item) return;
    updateCriteria(id, { isActive: !item.isActive });
  };

  const deleteCriteria = (id) => {
    const target = criteria.find((item) => item.id === id);
    if (!target) return false;
    if (!window.confirm(`Delete "${target.name}" criteria? This will remove related scoring data.`)) {
      return false;
    }
    const ok = configManager.deleteEvaluationCriteria(id);
    if (ok) {
      cleanupCriteriaEvaluationData(target.name);
      setCriteria((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Criteria deleted.' });
      return true;
    }
    setMessage({ type: 'error', text: 'Unable to delete criteria.' });
    return false;
  };

  const exportConfig = () => {
    const config = configManager.exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackathon-config-${config.session.year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = (config) => {
    const ok = configManager.importConfig(config);
    if (ok) {
      setSession(clone(hackathonConfig.session));
      setJuries(clone(hackathonConfig.juryMembers));
      setTeams(clone(hackathonConfig.teams));
      setCriteria(clone(hackathonConfig.evaluationCriteria));
      setMessage({ type: 'success', text: 'Configuration imported successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Invalid configuration file format.' });
    }
  };

  const dismissMessage = () => setMessage(null);

  const stats = useMemo(
    () => ({
      juries: juries.length,
      teams: teams.length,
      criteria: criteria.length
    }),
    [juries.length, teams.length, criteria.length]
  );

  return {
    session,
    juries,
    teams,
    criteria,
    stats,
    message,
    dismissMessage,
    updateSession,
    addJury,
    updateJury,
    toggleJury,
    deleteJury,
    addTeam,
    updateTeam,
    toggleTeam,
    deleteTeam,
    addCriteria,
    updateCriteria,
    toggleCriteria,
    deleteCriteria,
    exportConfig,
    importConfig
  };
}
