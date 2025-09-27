import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const emptyForm = {
  name: '',
  designation: '',
  department: '',
  email: '',
  phone: '',
  expertise: ''
};

function ConfigJuriesSection({ juries, onAdd, onUpdate, onToggle, onDelete }) {
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const filteredJuries = useMemo(() => {
    if (!query) return juries;
    const lc = query.toLowerCase();
    return juries.filter((jury) =>
      [jury.name, jury.designation, jury.department]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lc))
    );
  }, [juries, query]);

  const handleAdd = () => {
    if (!form.name || !form.designation) return;
    onAdd({
      ...form,
      expertise: form.expertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    });
    setForm(emptyForm);
    setShowAdd(false);
  };

  const startEdit = (jury) => {
    setEditingId(jury.id);
    setEditForm({
      name: jury.name || '',
      designation: jury.designation || '',
      department: jury.department || '',
      email: jury.email || '',
      phone: jury.phone || '',
      expertise: (jury.expertise || []).join(', ')
    });
  };

  const submitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, {
      ...editForm,
      expertise: editForm.expertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    });
    setEditingId(null);
    setEditForm(emptyForm);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Jury members</h2>
          <p className="text-sm text-slate-400">Manage the evaluation panel and their availability.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search juries"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 sm:w-56"
          />
          <button
            type="button"
            onClick={() => {
              setShowAdd((prev) => !prev);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition"
          >
            {showAdd ? 'Cancel' : 'Add jury'}
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
              Save member
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner shadow-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Role / Department</th>
              <th className="px-4 py-3 text-left">Contacts</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredJuries.map((jury) => (
              <tr key={jury.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-4">
                  <div className="font-semibold text-white">{jury.name}</div>
                  {jury.expertise?.length ? (
                    <div className="text-xs text-slate-500">Expertise: {jury.expertise.join(', ')}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div>{jury.designation}</div>
                  <div className="text-xs text-slate-500">{jury.department}</div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-400 space-y-1">
                  {jury.email ? <div>{jury.email}</div> : null}
                  {jury.phone ? <div>{jury.phone}</div> : null}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onToggle(jury.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      jury.isActive
                        ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border border-slate-700 bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {jury.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-4">
                  {editingId === jury.id ? (
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
                            setEditForm(emptyForm);
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
                        onClick={() => startEdit(jury)}
                        className="rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:border-orange-400/40"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(jury.id)}
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

export default ConfigJuriesSection;
