import { Card, Button, Row, Col, Form } from 'react-bootstrap';
import { useState } from 'react';

const EDITransform = () => {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransform = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(`<?xml version="1.0" encoding="UTF-8"?>
<EDI>
  <Header>
    <Type>${selectedType}</Type>
    <Tenant>${selectedTenant}</Tenant>
    <Date>${new Date().toISOString()}</Date>
  </Header>
  <Data>
    <!-- Transformed EDI data -->
    <Item code="123">Sample Item</Item>
    <Item code="456">Another Item</Item>
  </Data>
</EDI>`);
      setLoading(false);
    }, 2000);
  };

  return (
    <div>
      <h2 className="mb-4">🔄 EDI Transformation</h2>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">Transform EDI to XML</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Tenant</Form.Label>
                  <Form.Select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                  >
                    <option value="">Choose Tenant</option>
                    <option value="Levi">Levi</option>
                    <option value="Nike">Nike</option>
                    <option value="Puma">Puma</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">Choose Type</option>
                    <option value="850">850 - Purchase Order</option>
                    <option value="856">856 - Shipment Notice</option>
                    <option value="855">855 - Purchase Order Acknowledgment</option>
                    <option value="810">810 - Invoice</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Choose EDI File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setFile((e.target as any).files?.[0] || null)}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleTransform}
                  disabled={!selectedTenant || !selectedType || !file || loading}
                  className="w-100"
                >
                  {loading ? 'Transforming...' : '🚀 Transform'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {result && (
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Generated XML</Card.Title>
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      📥 Download
                    </Button>
                    <Button variant="outline-success" size="sm">
                      ✓ Validate
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <pre style={{ maxHeight: '400px', overflow: 'auto', fontSize: '0.85rem' }}>
                  {result}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default EDITransform;
