import { useState } from 'react';

const emptyCriteriaForm = {
  name: '',
  maxMarks: 10,
  weight: 0,
  description: ''
};

function ConfigCriteriaSection({ criteria, onAdd, onUpdate, onToggle, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyCriteriaForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyCriteriaForm);

  const handleAdd = () => {
    if (!form.name || Number(form.maxMarks) <= 0) return;
    onAdd({ ...form });
    setForm(emptyCriteriaForm);
    setShowAdd(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name || '',
      maxMarks: item.maxMarks ?? 10,
      weight: item.weight ?? 0,
      description: item.description || ''
    });
  };

  const submitEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, {
      ...editForm,
      maxMarks: parseInt(editForm.maxMarks, 10),
      weight: parseInt(editForm.weight ?? 0, 10)
    });
    setEditingId(null);
    setEditForm(emptyCriteriaForm);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Evaluation criteria</h2>
          <p className="text-sm text-slate-400">Define the rubric fields and their maximum marks.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd((prev) => !prev);
            setForm(emptyCriteriaForm);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 shadow-lg shadow-orange-500/40 transition"
        >
          {showAdd ? 'Cancel' : 'Add criteria'}
        </button>
      </div>

      {showAdd ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Max marks</span>
              <input
                type="number"
                min="1"
                value={form.maxMarks}
                onChange={(event) => setForm((prev) => ({ ...prev, maxMarks: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Weight</span>
              <input
                type="number"
                min="0"
                value={form.weight}
                onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-white focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-emerald-500/30 transition"
            >
              Save criteria
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {criteria.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40">
            {editingId === item.id ? (
              <div className="space-y-3">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Name</span>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2 text-xs text-slate-500">
                    <span>Max marks</span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.maxMarks}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, maxMarks: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-xs text-slate-500">
                    <span>Weight</span>
                    <input
                      type="number"
                      min="0"
                      value={editForm.weight}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, weight: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-xs text-slate-500">
                  <span>Description</span>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
                  />
                </label>
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
                      setEditForm(emptyCriteriaForm);
                    }}
                    className="flex-1 rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-300 hover:border-orange-400/40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    {item.description ? (
                      <p className="text-xs text-slate-400">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isActive
                        ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border border-slate-700 bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Max: {item.maxMarks}</span>
                  <span>Weight: {item.weight}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="flex-1 rounded-lg border border-slate-700 px-3 py-1 font-semibold text-slate-200 hover:border-orange-400/40"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 font-semibold text-red-200 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default ConfigCriteriaSection;
