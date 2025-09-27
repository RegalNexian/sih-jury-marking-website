import { Link } from 'react-router-dom';
import JuryCard from '../components/JuryCard';
import { configManager } from '../config/hackathonConfig';
import { juryProfiles } from '../data/juryData';
import PageLayout from '../components/layout/PageLayout';
import HeroHeader from '../components/ui/HeroHeader';
import StatCard from '../components/ui/StatCard';

function Homepage() {
  const ADMIN_CREDENTIALS = {
    id: 'jury-admin',
    password: 'S1H@2025'
  };
  const sessionInfo = configManager.getSessionInfo();
  
  const hero = (
    <HeroHeader
      eyebrow="Smart India Hackathon"
      title={sessionInfo.title}
      subtitle={sessionInfo.subtitle}
      description="Professional jury marking system for real-time evaluation, transparent scoring, and effortless coordination across devices."
      actions={[
        <Link
          key="admin"
          to="/admin"
          state={ADMIN_CREDENTIALS}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-semibold shadow-lg shadow-orange-500/40"
        >
          Admin access
        </Link>,
        <a
          key="panels"
          href="#jury-panels"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-400/30 bg-orange-500/10 text-orange-200/80 hover:text-white transition"
        >
          View judge panels
        </a>
      ]}
      kicker={sessionInfo.organization}
    />
  );

  const stats = [
    { title: 'Active Judges', value: configManager.getActiveJuryMembers().length, helper: 'Ready to evaluate', accent: 'bg-emerald-400' },
    { title: 'Evaluation Criteria', value: configManager.getActiveEvaluationCriteria().length, helper: 'Customizable rubric', accent: 'bg-blue-400' },
    { title: 'Teams Participating', value: configManager.getActiveTeams().length, helper: 'Awaiting assessments', accent: 'bg-purple-400' }
  ];

  return (
    <PageLayout hero={hero}>
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="space-y-12">
          <div id="jury-panels" className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-orange-500/30 text-orange-300 text-xs font-semibold uppercase tracking-[0.2em]">
              Evaluation panel
            </span>
            <h2 className="text-4xl font-semibold text-white mt-4 mb-3">Meet the judges</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Expert jury members ready to evaluate innovation, technical excellence, and execution across every team submission.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {juryProfiles.map((jury) => (
                <JuryCard key={jury.id} jury={jury} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-700/60 p-6 shadow-xl shadow-slate-950/50 text-center">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Need administrative access?</h3>
            <p className="text-sm text-slate-400">Administrative tools are managed by the organizing committee. Please contact the event lead for credentials or updates.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

export default Homepage;