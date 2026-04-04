import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <div className="brand-title">PulseShield</div>
            <div className="brand-sub">Opportunity loss cover</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink end className="nav-link" to="/">
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/claims">
            Claims
          </NavLink>
          <NavLink className="nav-link" to="/history">
            History
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar" aria-hidden>
              {user?.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-meta">{user?.platform || 'Gig worker'}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
