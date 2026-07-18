import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(username, password);

      const normalizedRole = (user.role ?? user.roles?.[0] ?? "").toUpperCase();

      if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.SUPPORT) {
        navigate("/admin");
      } else if (normalizedRole === ROLES.SHOPKEEPER) {
        navigate("/shopkeeper/billing");
      } else if (normalizedRole === ROLES.CUSTOMER || normalizedRole === ROLES.USER) {
        navigate("/customer");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column bg-light">
      <Row className="flex-grow-1 d-flex align-items-center justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={5} xl={4} className="d-flex justify-content-center">
          <Card className="p-4 shadow w-100" style={{ minWidth: "300px", maxWidth: "400px" }}>
            <Card.Body>
              <h3 className="text-center mb-4">{t('login.title')}</h3>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>{t('login.username')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('login.enterUsername')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>{t('login.password')}</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder={t('login.enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {t('login.loggingIn')}
                    </>
                  ) : (
                    t('login.loginButton')
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
