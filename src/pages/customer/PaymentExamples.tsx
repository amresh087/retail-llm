import React from 'react';
import type { PaymentDetails } from '../../components/PaymentMethodSelector';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';

/**
 * PaymentExamples.tsx
 * 
 * Demonstrates different payment scenarios:
 * 1. User with sufficient wallet balance
 * 2. User with insufficient wallet balance
 * 3. User with no wallet
 */

// Scenario 1: User with sufficient wallet balance
export const ScenarioSufficientBalance = () => {
  const handlePayment = (details: PaymentDetails) => {
    console.log('Order with sufficient balance:', details);
  };

  return (
    <PaymentMethodSelector
      walletBalance={2000}        // Balance > Cart Total
      totalAmount={1250.50}
      onPaymentMethodChange={(_, details) => {
        if (details) handlePayment(details);
      }}
    />
  );
};

// Scenario 2: User with insufficient wallet balance
export const ScenarioInsufficientBalance = () => {
  const handlePayment = (details: PaymentDetails) => {
    console.log('Order with insufficient balance:', details);
  };

  return (
    <PaymentMethodSelector
      walletBalance={500}         // Balance < Cart Total
      totalAmount={1250.50}
      onPaymentMethodChange={(_, details) => {
        if (details) handlePayment(details);
      }}
    />
  );
};

// Scenario 3: User with no wallet balance
export const ScenarioNoWallet = () => {
  const handlePayment = (details: PaymentDetails) => {
    console.log('Order with no wallet:', details);
  };

  return (
    <PaymentMethodSelector
      walletBalance={0}           // No balance
      totalAmount={1250.50}
      onPaymentMethodChange={(_, details) => {
        if (details) handlePayment(details);
      }}
    />
  );
};

// Full example with all scenarios
const PaymentExamples = () => {
  const [activeTab, setActiveTab] = React.useState<'sufficient' | 'insufficient' | 'none'>('sufficient');

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Payment UI Examples</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('sufficient')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'sufficient' ? '#2196F3' : '#ddd',
            color: activeTab === 'sufficient' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Sufficient Balance
        </button>
        <button
          onClick={() => setActiveTab('insufficient')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'insufficient' ? '#2196F3' : '#ddd',
            color: activeTab === 'insufficient' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Insufficient Balance
        </button>
        <button
          onClick={() => setActiveTab('none')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'none' ? '#2196F3' : '#ddd',
            color: activeTab === 'none' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          No Wallet
        </button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        {activeTab === 'sufficient' && <ScenarioSufficientBalance />}
        {activeTab === 'insufficient' && <ScenarioInsufficientBalance />}
        {activeTab === 'none' && <ScenarioNoWallet />}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Scenario Description</h3>
        {activeTab === 'sufficient' && (
          <p>
            <strong>Sufficient Balance:</strong> User has ₹2000 in wallet, cart total is ₹1250.50.
            All three payment options are available. User can pay entirely from wallet.
          </p>
        )}
        {activeTab === 'insufficient' && (
          <p>
            <strong>Insufficient Balance:</strong> User has ₹500 in wallet, cart total is ₹1250.50.
            'Wallet Only' option is disabled. User must use 'Wallet + Cash' or 'Cash Only'.
          </p>
        )}
        {activeTab === 'none' && (
          <p>
            <strong>No Wallet:</strong> User has ₹0 in wallet. Only 'Cash Only' option is available.
            Perfect for users who prefer to pay entirely by cash or don't have wallet setup.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentExamples;
