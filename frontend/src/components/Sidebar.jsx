import { NavLink } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '~' },
  { to: '/banks', label: 'Liquidez', icon: '$' },
  { to: '/investments', label: 'Inversiones', icon: '%' },
  { to: '/income', label: 'Ingresos Pasivos', icon: '+' },
  { to: '/snapshot/new', label: 'Registro Mensual', icon: '#' },
];

export default function Sidebar({ onClose }) {
  const { profiles, activeProfileId, selectProfile } = useProfile();

  return (
    <aside className="w-72 lg:w-64 h-full min-h-screen bg-slate-800 text-white flex flex-col">
      {/* Cabecera del sidebar */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Finanzas</h1>
          <p className="text-slate-400 text-sm">Control patrimonial</p>
        </div>
        {/* Botón cerrar — solo visible en móvil */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
          aria-label="Cerrar menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selector de perfil */}
      <div className="px-4 py-3 border-b border-slate-700">
        <label className="block text-xs text-slate-400 mb-1">Perfil activo</label>
        <select
          value={activeProfileId ?? ''}
          onChange={(e) => selectProfile(parseInt(e.target.value, 10))}
          className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span className="text-lg font-mono w-6 text-center">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <NavLink
          to="/profiles"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`
          }
        >
          <span className="text-lg font-mono w-6 text-center">@</span>
          <span>Gestionar Perfiles</span>
        </NavLink>
      </div>
    </aside>
  );
}
