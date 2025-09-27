import { useMemo, useState } from 'react';

const emptyTeamForm = {
  name: '',
  members: '',
  projectTitle: '',
  category: ''
};

function ConfigTeamsSection({ teams, onAdd, onUpdate, onToggle, onDelete }) {
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyTeamForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyTeamForm);

  const filteredTeams = useMemo(() => {
    if (!query) return teams;
    const lc = query.toLowerCase();
    return teams.filter((team) =>
      [team.name, team.projectTitle, team.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lc))
    );
  }, [teams, query]);

  const handleAdd = () => {
    if (!form.name) return;
    onAdd({
      ...form,
      members: form.members
        .split(',')
        .map((member) => member.trim())
        .filter(Boolean)
    });
    setForm(emptyTeamForm);
    setShowAdd(false);
  };

  const startEdit = (team) => {
    setEditingId(team.id);
    setEditForm({
      name: team.name || '',
      members: (team.members || []).join(', '),
      projectTitle: team.projectTitle || '',
      category: team.category || ''
    });
  };

  const submitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, {
      ...editForm,
      members: editForm.members
        .split(',')
        .map((member) => member.trim())
        .filter(Boolean)
    });
    setEditingId(null);
    setEditForm(emptyTeamForm);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Teams</h2>
          <p className="text-sm text-slate-400">Manage participating teams and their project metadata.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 sm:w-56"
          />
          <button
            type="button"
            onClick={() => {
              setShowAdd((prev) => !prev);
              setForm(emptyTeamForm);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition"
          >
            {showAdd ? 'Cancel' : 'Add team'}
          </button>
        </div>
      </div>

      {showAdd ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{key}</span>
                <input
                  type="text"
                  value={value}
                  onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-emerald-500/30 transition"
            >
              Save team
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner shadow-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredTeams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-4">
                  <div className="font-semibold text-white">{team.name}</div>
                  {team.members?.length ? (
                    <div className="text-xs text-slate-500">{team.members.join(', ')}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div>{team.projectTitle || '—'}</div>
                  <div className="text-xs text-slate-500">Registered {team.registrationDate}</div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-400">{team.category || '—'}</td>
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onToggle(team.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      team.isActive
                        ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border border-slate-700 bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {team.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-4">
                  {editingId === team.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(editForm).map(([key, value]) => (
                          <label key={key} className="text-xs text-slate-400">
                            <span className="block mb-1 capitalize text-slate-500">{key}</span>
                            <input
                              type="text"
                              value={value}
                              onChange={(event) =>
                                setEditForm((prev) => ({ ...prev, [key]: event.target.value }))
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-white focus:border-orange-400 focus:outline-none"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={submitEdit}
                          className="flex-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200 hover:bg-emerald-500/20"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(emptyTeamForm);
                          }}
                          className="flex-1 rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-300 hover:border-orange-400/40"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(team)}
                        className="rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:border-orange-400/40"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(team.id)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 font-semibold text-red-200 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ConfigTeamsSection;
