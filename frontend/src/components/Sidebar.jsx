import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '~' },
  { to: '/banks', label: 'Liquidez', icon: '$' },
  { to: '/investments', label: 'Inversiones', icon: '%' },
  { to: '/income', label: 'Ingresos Pasivos', icon: '+' },
  { to: '/snapshot/new', label: 'Registro Mensual', icon: '#' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Finanzas</h1>
        <p className="text-slate-400 text-sm">Control patrimonial</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
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
    </aside>
  );
}
