import { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { createProfile, updateProfile, deleteProfile } from '../services/api';

export default function Profiles() {
  const { profiles, setProfiles, activeProfileId, selectProfile } = useProfile();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await createProfile({ name: newName.trim() });
      setProfiles([...profiles, created]);
      setNewName('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartEdit = (profile) => {
    setEditingId(profile.id);
    setEditingName(profile.name);
  };

  const handleSaveEdit = async (id) => {
    setError('');
    try {
      const updated = await updateProfile(id, { name: editingName.trim() });
      setProfiles(profiles.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (profiles.length <= 1) return;
    if (!confirm('Eliminar este perfil y todos sus datos?')) return;
    setError('');
    try {
      await deleteProfile(id);
      const remaining = profiles.filter((p) => p.id !== id);
      setProfiles(remaining);
      if (activeProfileId === id) {
        selectProfile(remaining[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 lg:space-y-6">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Gestionar Perfiles</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabla de perfiles */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[380px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 lg:px-6 py-4">
                    {editingId === profile.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border rounded-lg px-3 py-1 text-sm w-full max-w-[160px]"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{profile.name}</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {activeProfileId === profile.id && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {editingId === profile.id ? (
                      <div className="flex gap-3">
                        <button onClick={() => handleSaveEdit(profile.id)} className="text-green-600 hover:underline text-sm">
                          Guardar
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline text-sm">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => selectProfile(profile.id)}
                          disabled={activeProfileId === profile.id}
                          className="text-blue-600 hover:underline text-sm disabled:opacity-40 disabled:no-underline"
                        >
                          Seleccionar
                        </button>
                        <button onClick={() => handleStartEdit(profile)} className="text-blue-600 hover:underline text-sm">
                          Renombrar
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          disabled={profiles.length <= 1}
                          className="text-red-600 hover:underline text-sm disabled:opacity-40 disabled:no-underline"
                          title={profiles.length <= 1 ? 'No se puede eliminar el único perfil' : ''}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulario nuevo perfil */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-4 lg:p-5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo perfil</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Nombre del perfil"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Crear
        </button>
      </form>
    </div>
  );
}
