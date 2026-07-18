import { Container } from "react-bootstrap";
import AdminHeader from "../../components/AdminHeader";

const FromPurchase = () => {
  return (
    <Container className="mt-4">
      <AdminHeader 
        title="Purchase Processing" 
        description="Process and manage purchase orders"
      />
      <h1>FromPurchase </h1>
    </Container>
  );
};

export default FromPurchase;
    