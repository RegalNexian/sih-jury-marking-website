import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import HeroHeader from '../components/ui/HeroHeader';
import AdminAccessForm from '../components/admin/AdminAccessForm';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminRealtimeTab from '../components/admin/AdminRealtimeTab';
import AdminLeaderboardTab from '../components/admin/AdminLeaderboardTab';
import AdminConsolidatedTab from '../components/admin/AdminConsolidatedTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import { useAdminSession } from '../hooks/useAdminSession';
import { useAdminData } from '../hooks/useAdminData';

const ADMIN_ID = 'jury-admin';
const ADMIN_PASSWORD = 'S1H@2025';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const TABS = [
  { id: 'overview', label: ' Overview' },
  { id: 'realtime', label: ' Realtime' },
  { id: 'leaderboard', label: ' Leaderboard' },
  { id: 'consolidated', label: ' Consolidated' },
  { id: 'settings', label: ' Settings' }
];

function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const session = useAdminSession({
    adminId: ADMIN_ID,
    adminPassword: ADMIN_PASSWORD,
    sessionDuration: SESSION_DURATION
  });
  const data = useAdminData(session.isAuthorized);

  const heroBeforeAuth = (
    <HeroHeader
      eyebrow="Admin workspace"
      title="Unlock the control center"
      description="Enter the daily credentials shared with the organising team to manage evaluations, monitor realtime activity, and export official scorecards."
      actions={[
        <Link
          key="home"
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-orange-200/80 transition hover:text-white"
        >
            Back to home
        </Link>
      ]}
    />
  );

  const heroAfterAuth = (
    <HeroHeader
      eyebrow="Admin workspace"
      title="Realtime evaluation control"
      description="Monitor presence across every jury desk, export consolidated scorecards, and keep the event audit-ready."
      actions={[
        <button
          key="signout"
          type="button"
          onClick={session.signOut}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-orange-400/40"
        >
          Sign out
        </button>,
        <Link
          key="config"
          to="/config"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-purple-200 transition hover:bg-purple-500/20"
        >
          System config
        </Link>,
        <Link
          key="home"
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-orange-200 transition hover:text-white"
        >
             Back to home
        </Link>
      ]}
    />
  );

  const tabButtons = useMemo(
    () =>
      TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[160px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition ${
              isActive
                ? 'bg-orange-500/20 text-orange-200 border-b-2 border-orange-400'
                : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      }),
    [activeTab]
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverviewTab
            metrics={data.metrics}
            savedEvaluations={data.savedEvaluations}
            pendingEvaluations={data.pendingEvaluations}
            onDownloadConsolidated={data.downloadConsolidated}
            onDownloadAllIndividuals={data.downloadAllIndividuals}
            onDownloadIndividual={data.downloadIndividual}
            onRefresh={data.refreshCore}
            isLoading={data.coreLoading}
          />
        );
      case 'realtime':
        return (
          <AdminRealtimeTab
            sessions={data.realtime.sessions}
            isLoading={data.realtime.loading}
            error={data.realtime.error}
            onRefresh={data.refreshRealtime}
          />
        );
      case 'leaderboard':
        return (
          <AdminLeaderboardTab
            teams={data.leaderboardTeams}
            generatedAt={data.leaderboardMeta.generatedAt}
            totalTeams={data.leaderboardMeta.totalTeams}
          />
        );
      case 'consolidated':
        return (
          <AdminConsolidatedTab
            onDownloadConsolidated={data.downloadConsolidated}
            hasData={data.consolidatedAvailable}
            generatedAt={data.consolidatedData?.generatedAt}
          />
        );
      case 'settings':
      default:
        return <AdminSettingsTab onResetData={data.resetData} onRefreshAll={data.refreshAll} />;
    }
  };

  if (!session.isAuthorized) {
    return (
      <PageLayout hero={heroBeforeAuth}>
        <section className="container mx-auto px-4 pb-16">
          <AdminAccessForm
            credentials={session.credentials}
            onChange={session.handleCredentialsChange}
            onSubmit={session.authorize}
            isSubmitting={session.isSubmitting}
            error={session.error}
          />
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout hero={heroAfterAuth}>
      <section className="container mx-auto px-4 pb-16 space-y-8">
        <div className="flex overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-inner shadow-slate-950/40">
          {tabButtons}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.9)]">
          {renderContent()}
        </div>
      </section>
    </PageLayout>
  );
}

export default AdminPage;
