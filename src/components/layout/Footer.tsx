import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container>
        <Row>
          <Col md={6} className="text-center text-md-start">
            © 2026 AI EDI Platform
          </Col>
          <Col md={6} className="text-center text-md-end">
            All rights reserved
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
