import { Link } from 'react-router-dom';
import './AdminHeader.css';

interface AdminHeaderProps {
  title: string;
  description?: string;
  showHomeButton?: boolean;
  showActions?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  description,
  showHomeButton = true,
  showActions = true
}) => {
  return (
    <div className="admin-header-wrapper">
      <div className="admin-header sticky">

        {/* LEFT */}
        <div className="header-left">
          {showHomeButton && (
            <Link to="/admin" className="back-button">
              ←
            </Link>
          )}

          <div className="header-title-group">
            <h1 className="admin-title">{title}</h1>
            {description && (
              <p className="admin-description">{description}</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        {showActions && (
          <div className="header-right">
            <button className="header-btn">Settings</button>

            <div className="header-divider"></div>

            <button className="header-btn primary">
              + Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;