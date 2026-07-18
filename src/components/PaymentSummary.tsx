import React from 'react';
import type { PaymentDetails } from './PaymentMethodSelector';
import './PaymentSummary.css';

interface PaymentSummaryProps {
  totalAmount: number;
  paymentDetails: PaymentDetails | null;
}

/**
 * PaymentSummary Component
 * Displays the correct payment breakdown with whole numbers (no decimals)
 */
const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalAmount,
  paymentDetails,
}) => {
  if (!paymentDetails) {
    return null;
  }

  // Round to whole numbers
  const roundAmount = (amount: number) => Math.round(amount);
  const totalAmt = roundAmount(totalAmount);

  const calculateCashAmount = () => {
    if (paymentDetails.method === 'wallet-cash') {
      return Math.max(0, totalAmt - (paymentDetails.walletAmount || 0));
    }
    if (paymentDetails.method === 'cash') {
      return totalAmt;
    }
    return 0;
  };

  const walletAmt = roundAmount(paymentDetails.walletAmount || 0);
  const cashAmt = calculateCashAmount();
  const totalPaid = walletAmt + cashAmt;

  return (
    <div className="payment-summary-container">
      <h4 className="summary-title">💳 Payment Breakdown</h4>
      
      <div className="summary-details">
        {paymentDetails.method === 'wallet' && (
          <>
            <div className="summary-row">
              <span className="summary-label">💰 From Wallet:</span>
              <span className="summary-value wallet">₹{walletAmt}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💵 By Cash:</span>
              <span className="summary-value cash">₹0</span>
            </div>
          </>
        )}

        {paymentDetails.method === 'wallet-cash' && (
          <>
            <div className="summary-row">
              <span className="summary-label">💳 From Wallet:</span>
              <span className="summary-value wallet">₹{walletAmt}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💵 By Cash:</span>
              <span className="summary-value cash">₹{cashAmt}</span>
            </div>
            <div className="summary-row info">
              <small>✓ Correct: ₹{walletAmt} + ₹{cashAmt} = ₹{totalPaid}</small>
            </div>
          </>
        )}

        {paymentDetails.method === 'cash' && (
          <>
            <div className="summary-row">
              <span className="summary-label">💰 From Wallet:</span>
              <span className="summary-value wallet">₹0</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💵 By Cash:</span>
              <span className="summary-value cash">₹{cashAmt}</span>
            </div>
          </>
        )}

        <div className="summary-row total">
          <span className="summary-label">📊 Grand Total:</span>
          <span className="summary-value-total">₹{totalPaid}</span>
        </div>

        {totalPaid !== totalAmt && (
          <div className="summary-error">
            ⚠️ Error: Total paid (₹{totalPaid}) does not match amount due (₹{totalAmt})
          </div>
        )}

        {totalPaid === totalAmt && (
          <div className="summary-success">
            ✅ Payment amount is correct!
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSummary;
