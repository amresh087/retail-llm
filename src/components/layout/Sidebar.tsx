import { useContext, useEffect } from "react";
import { AuthContext } from "../../auth/AuthContext";
import { Nav, Offcanvas } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { SidebarContext } from "./SidebarContext";

const Sidebar = () => {
  const auth = useContext(AuthContext);
  const role = auth?.user?.role;

  const { show, setShow } = useContext(SidebarContext);

  const close = () => setShow(false);

  // Close the offcanvas when the route changes (ensures it hides after navigation)
  const location = useLocation();
  useEffect(() => {
    if (show) setShow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const content = (
    <Nav className="flex-column p-3">
      <h6 className="text-muted mb-3">MENU</h6>

      {role === "ADMIN" && (
        <>
          <Nav.Link as={Link} to="/admin" onClick={close}>Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/admin/users" onClick={close}>Users</Nav.Link>
          <Nav.Link as={Link} to="/admin/transaction-types" onClick={close}>Transaction Types</Nav.Link>
          <Nav.Link as={Link} to="/admin/reports" onClick={close}>Reports</Nav.Link>
          <Nav.Link as={Link} to="/admin/from-purchase" onClick={close}>From Purchase</Nav.Link>
          <Nav.Link as={Link} to="/admin/admin-products" onClick={close}>Admin Products</Nav.Link>
          <Nav.Link as={Link} to="/admin/admin-inventory" onClick={close}>Admin Inventory</Nav.Link>
          <Nav.Link as={Link} to="/admin/rewards" onClick={close}>💰 Customer Rewards</Nav.Link>
        </>
      )}

      {role === "SHOPKEEPER" && (
        <>
          <Nav.Link as={Link} to="/shopkeeper" onClick={close}>Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/shopkeeper/products" onClick={close}>Products</Nav.Link>
          <Nav.Link as={Link} to="/shopkeeper/inventory" onClick={close}>Inventory</Nav.Link>
          <Nav.Link as={Link} to="/shopkeeper/billing" onClick={close}>Billing</Nav.Link>
          <Nav.Link as={Link} to="/shopkeeper/rewards" onClick={close}>💳 Rewards</Nav.Link>
        </>
      )}

      {role === "CUSTOMER" && (
        <>
          <Nav.Link as={Link} to="/customer" onClick={close}>Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/customer/products" onClick={close}>Products</Nav.Link>
          <Nav.Link as={Link} to="/customer/cart" onClick={close}>Cart</Nav.Link>
          <Nav.Link as={Link} to="/customer/orders" onClick={close}>Orders</Nav.Link>
          <Nav.Link as={Link} to="/customer/rewards" onClick={close}>💰 Rewards & Wallet</Nav.Link>
        </>
      )}
    </Nav>
  );

  return (
    <>
      {/* Desktop */}
      <div className="bg-light border-end d-none d-md-block" style={{ width: "220px", minHeight: "100vh" }}>
        {content}
      </div>

      {/* Mobile Offcanvas */}
      <Offcanvas show={show} onHide={close} className="d-md-none">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{content}</Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
