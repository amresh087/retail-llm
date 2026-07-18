import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const menuItems = [
    { label: 'Dashboard', icon: '📊', path: '/admin' },
    { label: 'Tenants', icon: '🏢', path: '/admin/tenants' },
    { label: 'Users', icon: '👥', path: '/admin/users' },
    { label: 'Transaction Types', icon: '🔁', path: '/admin/transaction-types' },
    { label: 'Mapping Documents', icon: '📄', path: '/admin/documents' },
    { label: 'EDI Transformation', icon: '🔄', path: '/admin/edi-transform' },
    { label: 'Transactions', icon: '💳', path: '/admin/transactions' },
    { label: 'AI Settings', icon: '⚡', path: '/admin/ai-settings' },
    { label: 'Prompts', icon: '💬', path: '/admin/prompts' },
    { label: 'Reports', icon: '📈', path: '/admin/reports' },
    { label: 'Logs', icon: '📋', path: '/admin/logs' },
    { label: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          {sidebarOpen && <span className="sidebar-logo">⚡</span>}
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              {sidebarOpen && <span className="menu-label">{item.label}</span>}
            </Link>
          ))}
          <hr className="menu-divider" />
          <button onClick={handleLogout} className="menu-item logout-btn">
            <span className="menu-icon">🚪</span>
            {sidebarOpen && <span className="menu-label">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">{children}</main>
    </div>
  );
};

export default AdminLayout;
