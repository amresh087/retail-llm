import { Link } from 'react-router-dom';
import './AdminHeader.css';

interface AdminReportHeaderProps {
  title: string;
  description?: string;
}

const AdminReportHeader: React.FC<AdminReportHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div className="admin-header-wrapper">
      <div className="admin-header sticky">

        {/* LEFT */}
        <div className="header-left">
          {/* ✅ Back to Reports instead of Admin */}
          <Link to="/admin/reports" className="back-button">
            ←
          </Link>

          <div className="header-title-group">
            <h1 className="admin-title">{title}</h1>
            {description && (
              <p className="admin-description">{description}</p>
            )}
          </div>
        </div>

        {/* RIGHT (optional minimal actions) */}
        <div className="header-right">
          <Link to="/reports">
            <button className="header-btn">
              📊 All Reports
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminReportHeader;