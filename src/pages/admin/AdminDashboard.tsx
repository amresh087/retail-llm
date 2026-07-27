import { Row, Col, Card } from 'react-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import api from '../../services/api';
import { tenantService } from '../../services/tenantService';
import { userService } from '../../services/userService';
import { documentService } from '../../services/documentService';
import './AdminDashboard.css';

type StatItem = { label: string; value: string; icon: string; gradient: string };
type ChartItem = { title: string; value: string; trend: string };

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

const defaultStats: StatItem[] = [
  { label: 'Total Tenants', value: '0', icon: '🏢', gradient: 'gradient-blue' },
  { label: 'Total Users', value: '0', icon: '👥', gradient: 'gradient-green' },
  { label: 'Total Documents', value: '0', icon: '📄', gradient: 'gradient-purple' },
  { label: 'EDI Jobs', value: '0', icon: '🔄', gradient: 'gradient-orange' },
  { label: 'Indexed Docs', value: '0', icon: '✓', gradient: 'gradient-teal' },
  { label: 'Failed Jobs', value: '0', icon: '❌', gradient: 'gradient-red' },
  { label: 'Storage Used', value: '0 GB', icon: '💾', gradient: 'gradient-pink' },
  { label: 'Active Users', value: '0', icon: '🟢', gradient: 'gradient-cyan' },
];

const defaultChartData: ChartItem[] = [
  { title: 'Documents Uploaded', value: '0', trend: '+0%' },
  { title: 'EDI Processed', value: '0', trend: '+0%' },
  { title: 'Success Rate', value: '0%', trend: '+0%' },
  { title: 'Storage Usage', value: '0 GB', trend: '+0%' },
];

const getActiveUserCount = (users: Array<{ status?: string; active?: boolean }>) =>
  users.filter((user) => {
    const status = (user.status || '').toLowerCase();
    return user.active !== false && !['inactive', 'disabled', 'blocked', 'suspended'].includes(status);
  }).length;

const buildDashboardData = (payload?: any) => {
  const totalTenants = payload?.totalTenants ?? payload?.tenantsCount ?? 0;
  const totalUsers = payload?.totalUsers ?? payload?.usersCount ?? 0;
  const totalDocuments = payload?.totalDocuments ?? payload?.documentsCount ?? 0;
  const ediJobs = payload?.ediJobs ?? payload?.totalJobs ?? totalDocuments;
  const indexedDocs = payload?.indexedDocs ?? payload?.indexedDocuments ?? 0;
  const failedJobs = payload?.failedJobs ?? payload?.failedDocuments ?? 0;
  const activeUsers = payload?.activeUsers ?? 0;
  const storageUsedGb = payload?.storageUsedGb ?? payload?.storageUsed ?? 0;

  return {
    stats: [
      { label: 'Total Tenants', value: formatNumber(totalTenants), icon: '🏢', gradient: 'gradient-blue' },
      { label: 'Total Users', value: formatNumber(totalUsers), icon: '👥', gradient: 'gradient-green' },
      { label: 'Total Documents', value: formatNumber(totalDocuments), icon: '📄', gradient: 'gradient-purple' },
      { label: 'EDI Jobs', value: formatNumber(ediJobs), icon: '🔄', gradient: 'gradient-orange' },
      { label: 'Indexed Docs', value: formatNumber(indexedDocs), icon: '✓', gradient: 'gradient-teal' },
      { label: 'Failed Jobs', value: formatNumber(failedJobs), icon: '❌', gradient: 'gradient-red' },
      { label: 'Storage Used', value: `${formatNumber(storageUsedGb)} GB`, icon: '💾', gradient: 'gradient-pink' },
      { label: 'Active Users', value: formatNumber(activeUsers), icon: '🟢', gradient: 'gradient-cyan' },
    ] as StatItem[],
    chartData: [
      { title: 'Documents Uploaded', value: formatNumber(totalDocuments), trend: '+0%' },
      { title: 'EDI Processed', value: formatNumber(ediJobs), trend: '+0%' },
      { title: 'Success Rate', value: totalDocuments > 0 ? `${((1 - failedJobs / totalDocuments) * 100).toFixed(1)}%` : '0%', trend: '+0%' },
      { title: 'Storage Usage', value: `${formatNumber(storageUsedGb)} GB`, trend: '+0%' },
    ] as ChartItem[],
  };
};

const AdminDashboard = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || 'Admin';
  const [stats, setStats] = useState<StatItem[]>(defaultStats);
  const [chartData, setChartData] = useState<ChartItem[]>(defaultChartData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const response = await api.get('/dashboard/metrics');
          if (isMounted) {
            const payload = buildDashboardData(response.data);
            setStats(payload.stats);
            setChartData(payload.chartData);
            return;
          }
        } catch {
          // fall back to existing service endpoints when a dedicated dashboard endpoint is unavailable
        }

        const [tenants, users, mappingDocuments] = await Promise.all([
          tenantService.getAll(),
          userService.getAll(),
          documentService.getAll('mappingdoc'),
        ]);

        if (!isMounted) return;

        const activeUsers = getActiveUserCount(users);
        const indexedDocs = mappingDocuments.filter((doc) => doc.status?.toLowerCase() === 'indexed').length;
        const failedJobs = mappingDocuments.filter((doc) => /failed|error/i.test(doc.status)).length;
        const storageUsedGb = Math.max(0, Math.round(mappingDocuments.length / 10));
        const ediJobs = mappingDocuments.filter((doc) => doc.type?.toLowerCase() === 'xml').length;

        const fallback = buildDashboardData({
          totalTenants: tenants.length,
          totalUsers: users.length,
          totalDocuments: mappingDocuments.length,
          ediJobs,
          indexedDocs,
          failedJobs,
          activeUsers,
          storageUsedGb,
        });

        setStats(fallback.stats);
        setChartData(fallback.chartData);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load dashboard metrics', err);
        setError('Unable to load dashboard metrics right now.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="dashboard-title">Dashboard</h2>
        <p className="dashboard-subtitle">Welcome back, <strong>{username}</strong></p>
      </div>

      {error && <div className="alert alert-warning py-2 mb-3">{error}</div>}

      {/* Stats Grid */}
      <Row className="g-3 mb-4">
        {stats.map((stat) => (
          <Col key={stat.label} xs={12} sm={6} md={4} lg={3}>
            <div className={`stat-card ${stat.gradient}`}>
              <div className="stat-card-content">
                <div className="stat-info">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{loading ? '—' : stat.value}</div>
                </div>
                <div className="stat-icon">{stat.icon}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <div className="mb-4">
        <h5 className="mb-3">📊 Charts & Analytics</h5>
        <Row className="g-3">
          {chartData.map((chart) => (
            <Col key={chart.title} md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="mb-3">{chart.title}</div>
                  <div className="fs-5 fw-bold mb-2">{loading ? '—' : chart.value}</div>
                  <div style={{ color: '#28a745', fontSize: '0.9rem' }}>{chart.trend} from last month</div>
                  <div
                    style={{
                      height: '40px',
                      background: 'linear-gradient(to right, #e3f2fd, #1976d2)',
                      borderRadius: '4px',
                      marginTop: '10px',
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Quick Actions */}
      <Row className="g-3">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">📋 Recent Documents</h5>
              <p className="text-muted small mb-2">Guide.pdf - Levi - PDF - v1 - Indexed</p>
              <p className="text-muted small mb-2">spec.pdf - Nike - PDF - v2 - Processing</p>
              <p className="text-muted small">manual.pdf - Puma - PDF - v1 - Indexed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">🚀 Quick Actions</h5>
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-sm btn-outline-primary">+ Create Tenant</button>
                <button className="btn btn-sm btn-outline-primary">+ Add User</button>
                <button className="btn btn-sm btn-outline-primary">📤 Upload Document</button>
                <button className="btn btn-sm btn-outline-primary">🔄 Transform EDI</button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;