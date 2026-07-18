import { Card, Form, Button, Row, Col, Nav } from 'react-bootstrap';
import { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    company: 'AI EDI Platform',
    timezone: 'UTC',
    llm: 'llama3.2:3b',
    embedding: 'nomic-embed-text',
    maxFileSize: '100',
    extensions: 'pdf,txt,edi,xml',
    emailEnabled: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
  });

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <h2 className="mb-4">⚙️ Settings</h2>

      <Row className="g-3">
        <Col lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Nav className="flex-column">
                <Nav.Link
                  active={activeTab === 'general'}
                  onClick={() => setActiveTab('general')}
                  className="cursor-pointer"
                >
                  General
                </Nav.Link>
                <Nav.Link
                  active={activeTab === 'ai'}
                  onClick={() => setActiveTab('ai')}
                  className="cursor-pointer"
                >
                  AI
                </Nav.Link>
                <Nav.Link
                  active={activeTab === 'storage'}
                  onClick={() => setActiveTab('storage')}
                  className="cursor-pointer"
                >
                  Storage
                </Nav.Link>
                <Nav.Link
                  active={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                  className="cursor-pointer"
                >
                  Notifications
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">
                {activeTab === 'general' && '🏢 General Settings'}
                {activeTab === 'ai' && '⚙️ AI Settings'}
                {activeTab === 'storage' && '💾 Storage Settings'}
                {activeTab === 'notifications' && '📧 Notification Settings'}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {activeTab === 'general' && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      value={settings.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      value={settings.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                    >
                      <option>UTC</option>
                      <option>EST</option>
                      <option>PST</option>
                      <option>IST</option>
                    </Form.Select>
                  </Form.Group>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </Form>
              )}

              {activeTab === 'ai' && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Default LLM</Form.Label>
                    <Form.Select
                      value={settings.llm}
                      onChange={(e) => handleChange('llm', e.target.value)}
                    >
                      <option>llama3.2:3b</option>
                      <option>llama2:7b</option>
                      <option>mistral:7b</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Embedding Model</Form.Label>
                    <Form.Select
                      value={settings.embedding}
                      onChange={(e) => handleChange('embedding', e.target.value)}
                    >
                      <option>nomic-embed-text</option>
                      <option>all-minilm</option>
                    </Form.Select>
                  </Form.Group>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </Form>
              )}

              {activeTab === 'storage' && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Max File Size (MB)</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => handleChange('maxFileSize', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Allowed Extensions</Form.Label>
                    <Form.Control
                      value={settings.extensions}
                      onChange={(e) => handleChange('extensions', e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </Form>
              )}

              {activeTab === 'notifications' && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Enable Email Notifications"
                      checked={settings.emailEnabled}
                      onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Server</Form.Label>
                    <Form.Control
                      value={settings.smtpServer}
                      onChange={(e) => handleChange('smtpServer', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Port</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => handleChange('smtpPort', e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
