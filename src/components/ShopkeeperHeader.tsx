import { Link } from 'react-router-dom';
import './ShopkeeperHeader.css';

interface ShopkeeperHeaderProps {
  title: string;
  description?: string;
  showDashboardButton?: boolean;
  showActions?: boolean;
}

const ShopkeeperHeader: React.FC<ShopkeeperHeaderProps> = ({
  title,
  description,
  showDashboardButton = true,
  showActions = true
}) => {
  return (
    <div className="shopkeeper-header-wrapper">
      <div className="shopkeeper-header sticky">
        
        {/* LEFT SECTION */}
        <div className="header-left">
          {showDashboardButton && (
            <Link to="/shopkeeper" className="back-button">
              ←
            </Link>
          )}

          <div className="header-title-group">
            <h1 className="shopkeeper-title">{title}</h1>
            {description && (
              <p className="shopkeeper-description">{description}</p>
            )}
          </div>
        </div>

        {/* RIGHT SECTION */}
        {showActions && (
          <div className="header-right">
            <button className="header-btn">Help</button>

            <div className="header-divider"></div>

            <button className="header-btn primary">
              Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopkeeperHeader;