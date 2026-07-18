import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useContext, useState } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: auth?.user?.username || '',
    email: auth?.user?.username + '@example.com' || '',
    role: auth?.user?.role || '',
    tenant: auth?.user?.tenantId || '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
  };

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password changed successfully!');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  return (
    <div>
      <h2 className="mb-4">👤 Profile</h2>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">Profile Information</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    value={profile.username}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control
                    value={profile.role}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tenant ID</Form.Label>
                  <Form.Control
                    value={profile.tenant}
                    disabled
                  />
                </Form.Group>

                <Button variant="primary" onClick={handleSaveProfile}>
                  💾 Save Profile
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">Change Password</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  />
                </Form.Group>

                <Button variant="primary" onClick={handleChangePassword}>
                  🔑 Change Password
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-light">
            <Card.Body>
              <h5 className="mb-3">👤 Account Info</h5>
              <div className="mb-3">
                <p className="small text-muted mb-1">Username</p>
                <p className="fw-medium">{profile.username}</p>
              </div>
              <div className="mb-3">
                <p className="small text-muted mb-1">Role</p>
                <p className="fw-medium">{profile.role}</p>
              </div>
              <div className="mb-3">
                <p className="small text-muted mb-1">Last Login</p>
                <p className="fw-medium">{new Date().toLocaleString()}</p>
              </div>
              <hr />
              <Button variant="outline-danger" className="w-100" onClick={handleLogout}>
                🚪 Logout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
