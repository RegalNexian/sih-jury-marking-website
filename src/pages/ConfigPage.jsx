import { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import HeroHeader from '../components/ui/HeroHeader';
import ConfigSessionSection from '../components/config/ConfigSessionSection';
import ConfigJuriesSection from '../components/config/ConfigJuriesSection';
import ConfigTeamsSection from '../components/config/ConfigTeamsSection';
import ConfigCriteriaSection from '../components/config/ConfigCriteriaSection';
import ConfigBackupPanel from '../components/config/ConfigBackupPanel';
import { useConfigData } from '../hooks/useConfigData';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'session', label: 'Session' },
  { id: 'jury', label: 'Juries' },
  { id: 'teams', label: 'Teams' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'backup', label: 'Backup' }
];

function ConfigPage() {
  const [activeTab, setActiveTab] = useState('session');
  const config = useConfigData();

  const hero = (
    <HeroHeader
      eyebrow="System configuration"
      title="Curate the hackathon experience"
      description="Adjust jury panels, teams, evaluation criteria, and session branding. Changes apply instantly across the platform."
      actions={[
        <Link
          key="admin"
          to="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-orange-200 transition hover:text-white"
        >
          ? Back to admin
        </Link>
      ]}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'session':
        return <ConfigSessionSection session={config.session} onUpdate={config.updateSession} />;
      case 'jury':
        return (
          <ConfigJuriesSection
            juries={config.juries}
            onAdd={config.addJury}
            onUpdate={config.updateJury}
            onToggle={config.toggleJury}
            onDelete={config.deleteJury}
          />
        );
      case 'teams':
        return (
          <ConfigTeamsSection
            teams={config.teams}
            onAdd={config.addTeam}
            onUpdate={config.updateTeam}
            onToggle={config.toggleTeam}
            onDelete={config.deleteTeam}
          />
        );
      case 'criteria':
        return (
          <ConfigCriteriaSection
            criteria={config.criteria}
            onAdd={config.addCriteria}
            onUpdate={config.updateCriteria}
            onToggle={config.toggleCriteria}
            onDelete={config.deleteCriteria}
          />
        );
      case 'backup':
      default:
        return <ConfigBackupPanel onExport={config.exportConfig} onImport={config.importConfig} />;
    }
  };

  return (
    <PageLayout hero={hero}>
      <section className="container mx-auto px-4 pb-16 space-y-8">
        {config.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg ${
              config.message.type === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{config.message.text}</span>
              <button
                type="button"
                onClick={config.dismissMessage}
                className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-inner shadow-slate-950/40">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-200 border-b-2 border-orange-400'
                    : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.9)] space-y-8">
          {renderContent()}
        </div>
      </section>
    </PageLayout>
  );
}

export default ConfigPage;
