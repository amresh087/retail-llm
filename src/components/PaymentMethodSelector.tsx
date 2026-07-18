import React, { useState } from 'react';
import './PaymentMethodSelector.css';

interface PaymentMethodSelectorProps {
  walletBalance?: number;
  totalAmount: number;
  onPaymentMethodChange?: (method: PaymentMethod, details?: PaymentDetails) => void;
}

export type PaymentMethod = 'wallet' | 'wallet-cash' | 'cash';

export interface PaymentDetails {
  method: PaymentMethod;
  walletAmount?: number;
  cashAmount?: number;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  walletBalance = 0,
  totalAmount,
  onPaymentMethodChange,
}) => {
  // Round to whole numbers (no decimals)
  const roundAmount = (amount: number) => Math.round(amount);
  const walletBal = roundAmount(walletBalance);
  const totalAmt = roundAmount(totalAmount);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wallet-cash');
  const [walletAmount, setWalletAmount] = useState(Math.min(walletBal, totalAmt));

  const cashAmount = selectedMethod === 'wallet-cash' 
    ? Math.max(0, totalAmt - walletAmount)
    : selectedMethod === 'cash'
    ? totalAmt
    : 0;

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    
    let newWalletAmount = 0;
    if (method === 'wallet') {
      newWalletAmount = Math.min(walletBal, totalAmt);
    } else if (method === 'wallet-cash') {
      newWalletAmount = Math.min(walletBal, totalAmt);
    }
    setWalletAmount(newWalletAmount);

    if (onPaymentMethodChange) {
      const newCashAmount = method === 'wallet-cash' 
        ? Math.max(0, totalAmt - newWalletAmount)
        : method === 'cash'
        ? totalAmt
        : 0;

      onPaymentMethodChange(method, {
        method,
        walletAmount: method !== 'cash' ? newWalletAmount : 0,
        cashAmount: newCashAmount,
      });
    }
  };

  const handleWalletIncrease = () => {
    const newValue = Math.min(walletAmount + 1, Math.min(walletBal, totalAmt));
    setWalletAmount(newValue);

    if (onPaymentMethodChange && selectedMethod === 'wallet-cash') {
      const newCashAmount = Math.max(0, totalAmt - newValue);
      onPaymentMethodChange('wallet-cash', {
        method: 'wallet-cash',
        walletAmount: newValue,
        cashAmount: newCashAmount,
      });
    }
  };

  const handleWalletDecrease = () => {
    const newValue = Math.max(0, walletAmount - 1);
    setWalletAmount(newValue);

    if (onPaymentMethodChange && selectedMethod === 'wallet-cash') {
      const newCashAmount = Math.max(0, totalAmt - newValue);
      onPaymentMethodChange('wallet-cash', {
        method: 'wallet-cash',
        walletAmount: newValue,
        cashAmount: newCashAmount,
      });
    }
  };

  const canUseWallet = walletBal > 0;

  return (
    <div className="payment-selector-container">
      <h3 className="payment-title">Select Payment Method</h3>
      
      {/* Total Amount Display */}
      <div className="amount-display">
        <div className="amount-label">Total Amount</div>
        <div className="amount-value">₹{totalAmt}</div>
      </div>

      {/* Wallet Balance Info */}
      {canUseWallet && (
        <div className="wallet-info">
          <span className="wallet-icon">💳</span>
          <span className="wallet-balance">Wallet Balance: ₹{walletBal}</span>
        </div>
      )}

      {/* Payment Options */}
      <div className="payment-options">
        {/* Option 1: Wallet Only */}
        {canUseWallet && (
          <label className={`payment-option ${selectedMethod === 'wallet' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment-method"
              value="wallet"
              checked={selectedMethod === 'wallet'}
              onChange={() => handleMethodChange('wallet')}
              disabled={walletBal < totalAmt}
              className="payment-radio"
            />
            <div className="option-content">
              <div className="option-header">
                <span className="option-icon">💰</span>
                <span className="option-title">Pay from Wallet</span>
                {walletBal >= totalAmt && <span className="badge-success">Sufficient</span>}
                {walletBal < totalAmt && <span className="badge-warning">Insufficient</span>}
              </div>
              <div className="option-description">₹{Math.min(walletBal, totalAmt)}</div>
            </div>
          </label>
        )}

        {/* Option 2: Wallet + Cash */}
        {canUseWallet && (
          <label className={`payment-option ${selectedMethod === 'wallet-cash' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment-method"
              value="wallet-cash"
              checked={selectedMethod === 'wallet-cash'}
              onChange={() => handleMethodChange('wallet-cash')}
              className="payment-radio"
            />
            <div className="option-content">
              <div className="option-header">
                <span className="option-icon">💳+💵</span>
                <span className="option-title">Wallet + Cash</span>
              </div>
              <div className="option-description">Flexible split payment</div>
              
              {selectedMethod === 'wallet-cash' && (
                <div className="split-payment-details">
                  <div className="split-row">
                    <span className="split-label">From Wallet:</span>
                    <div className="split-amount-control">
                      <button 
                        className="amount-btn decrease-btn"
                        onClick={handleWalletDecrease}
                        title="Decrease by ₹1"
                      >
                        −
                      </button>
                      <div className="split-amount">₹{walletAmount}</div>
                      <button 
                        className="amount-btn increase-btn"
                        onClick={handleWalletIncrease}
                        title="Increase by ₹1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="split-row">
                    <span className="split-label">By Cash:</span>
                    <input 
                      type="number" 
                      className="form-control"
                      value={cashAmount}
                      placeholder="Remaining amount"
                      readOnly
                    />
                  </div>
                </div>
              )}
            </div>
          </label>
        )}

        {/* Option 3: Cash Only */}
        <label className={`payment-option ${selectedMethod === 'cash' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="payment-method"
            value="cash"
            checked={selectedMethod === 'cash'}
            onChange={() => handleMethodChange('cash')}
            className="payment-radio"
          />
          <div className="option-content">
            <div className="option-header">
              <span className="option-icon">💵</span>
              <span className="option-title">Pay by Cash</span>
            </div>
            <div className="option-description">₹{totalAmt}</div>
          </div>
        </label>
      </div>

      {/* Summary */}
      <div className="payment-summary">
        <div className="summary-row">
          <span className="summary-label">Payment Method:</span>
          <span className="summary-value">
            {selectedMethod === 'wallet' && 'Wallet Only'}
            {selectedMethod === 'wallet-cash' && 'Wallet + Cash'}
            {selectedMethod === 'cash' && 'Cash Only'}
          </span>
        </div>
        {selectedMethod !== 'cash' && (
          <div className="summary-row">
            <span className="summary-label">Wallet Amount:</span>
            <span className="summary-value">₹{walletAmount}</span>
          </div>
        )}
        {selectedMethod !== 'wallet' && (
          <div className="summary-row">
            <span className="summary-label">Cash Amount:</span>
            <span className="summary-value">₹{cashAmount}</span>
          </div>
        )}
        <div className="summary-row summary-total">
          <span className="summary-label">Total:</span>
          <span className="summary-value">₹{totalAmt}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
