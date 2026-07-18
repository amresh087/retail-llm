import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useState } from 'react';

const AISettings = () => {
  const [settings, setSettings] = useState({
    llmModel: 'llama3.2:3b',
    embeddingModel: 'nomic-embed-text',
    chunkSize: '800',
    chunkOverlap: '150',
    topK: '5',
    temperature: '0.2',
  });

  const handleChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    alert('AI Settings saved successfully!');
  };

  return (
    <div>
      <h2 className="mb-4">⚙️ AI Settings</h2>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">LLM Configuration</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>LLM Model</Form.Label>
                      <Form.Select
                        value={settings.llmModel}
                        onChange={(e) => handleChange('llmModel', e.target.value)}
                      >
                        <option>llama3.2:3b</option>
                        <option>llama2:7b</option>
                        <option>mistral:7b</option>
                        <option>neural-chat:7b</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Embedding Model</Form.Label>
                      <Form.Select
                        value={settings.embeddingModel}
                        onChange={(e) => handleChange('embeddingModel', e.target.value)}
                      >
                        <option>nomic-embed-text</option>
                        <option>all-minilm</option>
                        <option>bge-small</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chunk Size</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.chunkSize}
                        onChange={(e) => handleChange('chunkSize', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chunk Overlap</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.chunkOverlap}
                        onChange={(e) => handleChange('chunkOverlap', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Top K</Form.Label>
                      <Form.Control
                        type="number"
                        value={settings.topK}
                        onChange={(e) => handleChange('topK', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temperature</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={settings.temperature}
                        onChange={(e) => handleChange('temperature', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="gap-2 d-flex">
                  <Button variant="primary" onClick={handleSave}>
                    💾 Save Settings
                  </Button>
                  <Button variant="secondary">↺ Reset to Defaults</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-light">
            <Card.Body>
              <h5 className="mb-3">📖 Quick Reference</h5>
              <div className="small">
                <p><strong>Chunk Size:</strong> Ideal is 800-1000 characters</p>
                <p><strong>Chunk Overlap:</strong> 10-20% of chunk size</p>
                <p><strong>Top K:</strong> Number of documents to retrieve (5-10)</p>
                <p><strong>Temperature:</strong> 0 = deterministic, 1 = creative</p>
                <p><strong>Recommended:</strong> Temperature 0.2 for production</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AISettings;
