import React, { useState } from 'react';
import type { PaymentDetails } from '../../components/PaymentMethodSelector';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import PaymentSummary from '../../components/PaymentSummary';
import './CheckoutPage.css';

const CheckoutPage: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetails | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Mock data
  const cartTotal = 1250.50;
  const walletBalance = 800;

  const handlePaymentMethodChange = (_method: string, details?: PaymentDetails) => {
    setSelectedPayment(details || null);
  };

  const handlePlaceOrder = () => {
    if (selectedPayment) {
      // Here you would send the payment details to your backend
      console.log('Order placed with payment:', selectedPayment);
      setOrderPlaced(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setOrderPlaced(false);
        setSelectedPayment(null);
      }, 3000);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Order Checkout</h1>
        <p>Complete your payment securely</p>
      </div>

      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary-card">
          <h3>Order Summary</h3>
          <div className="summary-items">
            <div className="summary-item">
              <span>Subtotal</span>
              <span>₹1,150.00</span>
            </div>
            <div className="summary-item">
              <span>Delivery Charge</span>
              <span>₹100.50</span>
            </div>
            <div className="summary-item total">
              <span>Total Amount</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <PaymentMethodSelector
          walletBalance={walletBalance}
          totalAmount={cartTotal}
          onPaymentMethodChange={handlePaymentMethodChange}
        />

        {/* Payment Summary - Shows correct breakdown */}
        <PaymentSummary
          totalAmount={cartTotal}
          paymentDetails={selectedPayment}
        />

        {/* Action Button */}
        <div className="checkout-actions">
          <button
            className={`btn-place-order ${!selectedPayment ? 'disabled' : ''}`}
            onClick={handlePlaceOrder}
            disabled={!selectedPayment}
          >
            {orderPlaced ? '✓ Order Placed!' : 'Place Order'}
          </button>
        </div>

        {/* Success Message */}
        {orderPlaced && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Order Placed Successfully!</h3>
            <p>Your order has been confirmed. You will receive updates shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
