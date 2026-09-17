import { useState } from 'react';
import type { Product } from './PizzaDetails';
import {
  calculateOrderTotals,
  processPayment,
  PaymentMethodType,
  PaymentStatus,
} from './services/payment';
import {
  Check,
  ShieldCheck,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Leaf,
  Truck,
  Heart,
  Tag,
  AlertCircle,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface PaymentProps {
  cart: Product[];
  onNavigate: (path: string) => void;
}

export function Payment({ cart, onNavigate }: PaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('razorpay');
  const [activePanelMethod, setActivePanelMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Derive totals from the shared price calculation helper
  const { subtotal, deliveryFee, taxes, total } = calculateOrderTotals(cart);

  const triggerNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    if (method === 'card') setActivePanelMethod('card');
    else if (method === 'upi') setActivePanelMethod('upi');
    else if (method === 'netbanking') setActivePanelMethod('netbanking');
    else if (method === 'wallet') setActivePanelMethod('wallet');
  };

  const handlePay = async () => {
    setPaymentStatus('processing');
    setErrorMessage(null);

    const result = await processPayment({
      orderId: 'PD-2048',
      amount: total,
      items: cart,
    });

    setPaymentStatus(result.status);

    if (result.success) {
      // Success path only reachable if a real verified payment occurs
      onNavigate('/order-confirmed');
    } else {
      setErrorMessage(
        result.error ||
          'Razorpay payment gateway is not configured. Live checkout requires backend order generation and verified gateway credentials.'
      );
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    // Honest presentation-only state per rule 15
    setCouponFeedback('Coupon promotions are currently unavailable in this preview.');
    setTimeout(() => setCouponFeedback(null), 4000);
  };

  // If cart is empty, show safe empty checkout state
  if (cart.length === 0) {
    return (
      <main className="payment-page page-shell">
        <div className="payment-empty-container">
          <div className="payment-empty-card">
            <ShoppingBag size={48} className="text-brand" />
            <h2>Your basket is empty</h2>
            <p>Please select your favourite pizzas to proceed to checkout.</p>
            <button
              type="button"
              className="button payment-return-menu-btn"
              onClick={() => onNavigate('/menu')}
            >
              Browse Pizzas
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="payment-page page-shell">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="payment-toast" role="status">
          <Info size={16} />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 1. Top Checkout Progress Stepper */}
      <section className="payment-stepper-wrap" aria-label="Checkout Progress">
        <div className="payment-stepper">
          {/* Step 1: Cart (Done) */}
          <div className="stepper-step step-done">
            <span className="stepper-circle">
              <Check size={14} aria-hidden="true" />
            </span>
            <span className="stepper-label">Cart</span>
          </div>
          <div className="stepper-line line-active" />

          {/* Step 2: Order Summary (Done) */}
          <div className="stepper-step step-done">
            <span className="stepper-circle">
              <Check size={14} aria-hidden="true" />
            </span>
            <span className="stepper-label">Order Summary</span>
          </div>
          <div className="stepper-line line-active" />

          {/* Step 3: Payment (Active) */}
          <div className="stepper-step step-active" aria-current="step">
            <span className="stepper-circle">3</span>
            <span className="stepper-label">Payment</span>
          </div>
          <div className="stepper-line" />

          {/* Step 4: Confirmation (Upcoming) */}
          <div className="stepper-step step-pending">
            <span className="stepper-circle">4</span>
            <span className="stepper-label">Confirmation</span>
          </div>
        </div>

        {/* Decorative Food Note */}
        <div className="stepper-script-note" aria-hidden="true">
          <span>Good Food</span>
          <span>Fuels Happy</span>
          <span>Moments ♥</span>
        </div>
      </section>

      {/* 2. Main 3-Column Payment Workspace */}
      <div className="payment-layout-grid">
        {/* Column 1: Left Payment Workspace */}
        <section className="payment-left-col">
          <div className="payment-heading-group">
            <div className="payment-eyebrow-row">
              <span className="pizza-slice-emoji">🍕</span>
              <span className="payment-eyebrow">SECURE PAYMENT</span>
            </div>
            <h1 className="payment-main-title">Complete Your Payment</h1>
            <p className="payment-subtitle-lead">
              You&apos;re just one step away from a delicious experience!
            </p>
            <p className="payment-subtitle-body">
              Choose your preferred payment method and complete your order securely.
            </p>
          </div>

          {/* Payment Methods Selection Stack */}
          <div className="payment-methods-stack" role="radiogroup" aria-label="Payment method choices">
            {/* Method 1: Pay with Razorpay (Recommended) */}
            <div
              className={`payment-method-card razorpay-method-card ${selectedMethod === 'razorpay' ? 'selected' : ''}`}
              onClick={() => handleMethodSelect('razorpay')}
              role="radio"
              aria-checked={selectedMethod === 'razorpay'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('razorpay')}
            >
              <div className="method-card-top">
                <div className="method-radio-left">
                  <span className="method-radio-dot" />
                  <div className="method-branding">
                    <span className="razorpay-icon-glyph">◺</span>
                    <strong className="method-title">Pay with Razorpay</strong>
                  </div>
                </div>
                <span className="recommended-pill">Recommended</span>
              </div>
              <p className="method-desc">Cards, UPI, Wallets, Net Banking and more</p>

              {/* 4 Mini Method Badges */}
              <div className="razorpay-submethods-row">
                <span className="submethod-pill">
                  <Smartphone size={13} className="text-orange" />
                  <span>UPI</span>
                </span>
                <span className="submethod-pill">
                  <CreditCard size={13} className="text-blue" />
                  <span>Cards</span>
                </span>
                <span className="submethod-pill">
                  <Building2 size={13} className="text-purple" />
                  <span>Net Banking</span>
                </span>
                <span className="submethod-pill">
                  <Wallet size={13} className="text-pink" />
                  <span>Wallets</span>
                </span>
              </div>
            </div>

            {/* Method 2: Credit / Debit Card */}
            <div
              className={`payment-method-card ${selectedMethod === 'card' ? 'selected' : ''}`}
              onClick={() => handleMethodSelect('card')}
              role="radio"
              aria-checked={selectedMethod === 'card'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('card')}
            >
              <div className="method-card-main-row">
                <div className="method-radio-left">
                  <span className="method-radio-dot" />
                  <CreditCard size={18} className="text-navy" aria-hidden="true" />
                  <div>
                    <strong className="method-title">Credit / Debit Card</strong>
                    <small className="method-sub">Visa, Mastercard, Rupay &amp; more</small>
                  </div>
                </div>
                <div className="method-brand-badges">
                  <span className="brand-chip visa-chip">VISA</span>
                  <span className="brand-chip mc-chip">MC</span>
                  <span className="brand-chip rupay-chip">RuPay</span>
                </div>
              </div>
            </div>

            {/* Method 3: UPI */}
            <div
              className={`payment-method-card ${selectedMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => handleMethodSelect('upi')}
              role="radio"
              aria-checked={selectedMethod === 'upi'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('upi')}
            >
              <div className="method-card-main-row">
                <div className="method-radio-left">
                  <span className="method-radio-dot" />
                  <Smartphone size={18} className="text-orange" aria-hidden="true" />
                  <div>
                    <strong className="method-title">UPI</strong>
                    <small className="method-sub">Pay using any UPI app</small>
                  </div>
                </div>
                <div className="method-brand-badges">
                  <span className="brand-chip gpay-chip">GPay</span>
                  <span className="brand-chip pe-chip">Pe</span>
                  <span className="brand-chip paytm-chip">Paytm</span>
                </div>
              </div>
            </div>

            {/* Method 4: Net Banking */}
            <div
              className={`payment-method-card ${selectedMethod === 'netbanking' ? 'selected' : ''}`}
              onClick={() => handleMethodSelect('netbanking')}
              role="radio"
              aria-checked={selectedMethod === 'netbanking'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('netbanking')}
            >
              <div className="method-card-main-row">
                <div className="method-radio-left">
                  <span className="method-radio-dot" />
                  <Building2 size={18} className="text-purple" aria-hidden="true" />
                  <div>
                    <strong className="method-title">Net Banking</strong>
                    <small className="method-sub">All major banks supported</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Method 5: Wallets */}
            <div
              className={`payment-method-card ${selectedMethod === 'wallet' ? 'selected' : ''}`}
              onClick={() => handleMethodSelect('wallet')}
              role="radio"
              aria-checked={selectedMethod === 'wallet'}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleMethodSelect('wallet')}
            >
              <div className="method-card-main-row">
                <div className="method-radio-left">
                  <span className="method-radio-dot" />
                  <Wallet size={18} className="text-blue" aria-hidden="true" />
                  <div>
                    <strong className="method-title">Wallets</strong>
                    <small className="method-sub">Paytm, Amazon Pay, Mobikwik &amp; more</small>
                  </div>
                </div>
                <div className="method-brand-badges">
                  <span className="brand-chip paytm-chip">Paytm</span>
                  <span className="brand-chip amazon-chip">Amazon</span>
                  <span className="brand-chip mobi-chip">M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Green Security Banner */}
          <div className="payment-security-banner">
            <div className="security-banner-left">
              <ShieldCheck size={24} className="text-emerald" aria-hidden="true" />
              <div>
                <strong>100% Secure Payments</strong>
                <p>Your payment information is encrypted and processed securely through Razorpay.</p>
              </div>
            </div>
            <div className="razorpay-logo-tag">
              <span className="razorpay-icon-glyph">◺</span>
              <strong>Razorpay</strong>
            </div>
          </div>
        </section>

        {/* Column 2: Center Razorpay Checkout Modal / Panel */}
        <section className="payment-center-col" aria-label="Razorpay Checkout Panel">
          <div className="razorpay-panel-card">
            {/* Dark Sleek Razorpay Header */}
            <header className="razorpay-header">
              <div className="razorpay-brand">
                <span className="razorpay-brand-glyph">◺</span>
                <span className="razorpay-brand-name">Razorpay</span>
              </div>
              <button
                type="button"
                className="razorpay-close-btn"
                onClick={() => {
                  setPaymentStatus('idle');
                  setErrorMessage(null);
                  triggerNotice('Checkout dismissed. You can review payment methods or order details.');
                }}
                aria-label="Close Razorpay checkout"
              >
                <X size={18} />
              </button>
            </header>

            {/* Merchant Details Bar */}
            <div className="merchant-strip">
              <div className="merchant-info">
                <div className="merchant-avatar">🍕</div>
                <div>
                  <strong className="merchant-name">PizzaDelight</strong>
                  <span className="merchant-order-id">Order #PD-2048</span>
                </div>
              </div>
              <div className="merchant-amount-wrap">
                <span className="merchant-price">₹{total}</span>
                <ChevronDown size={14} className="merchant-chevron" />
              </div>
            </div>

            {/* Panel Body: Payment Method Choices inside Razorpay */}
            <div className="razorpay-body">
              <p className="razorpay-section-label">Select a payment method</p>

              <div className="razorpay-methods-list">
                {/* 1. UPI */}
                <button
                  type="button"
                  className={`razorpay-method-row ${activePanelMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setActivePanelMethod('upi')}
                >
                  <div className="rzp-row-left">
                    <Smartphone size={17} className="text-orange" />
                    <div className="rzp-row-text">
                      <strong>UPI</strong>
                      <small>Pay using any UPI app</small>
                    </div>
                  </div>
                  <div className="rzp-row-chips">
                    <span className="brand-chip gpay-chip">GPay</span>
                    <span className="brand-chip pe-chip">Pe</span>
                    <span className="brand-chip paytm-chip">Paytm</span>
                  </div>
                </button>

                {/* 2. Cards */}
                <button
                  type="button"
                  className={`razorpay-method-row ${activePanelMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setActivePanelMethod('card')}
                >
                  <div className="rzp-row-left">
                    <CreditCard size={17} className="text-navy" />
                    <div className="rzp-row-text">
                      <strong>Cards</strong>
                      <small>Credit / Debit cards</small>
                    </div>
                  </div>
                  <div className="rzp-row-chips">
                    <span className="brand-chip visa-chip">VISA</span>
                    <span className="brand-chip mc-chip">MC</span>
                    <span className="brand-chip rupay-chip">RuPay</span>
                  </div>
                </button>

                {/* 3. Net Banking */}
                <button
                  type="button"
                  className={`razorpay-method-row ${activePanelMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setActivePanelMethod('netbanking')}
                >
                  <div className="rzp-row-left">
                    <Building2 size={17} className="text-purple" />
                    <div className="rzp-row-text">
                      <strong>Net Banking</strong>
                      <small>All major banks</small>
                    </div>
                  </div>
                </button>

                {/* 4. Wallets */}
                <button
                  type="button"
                  className={`razorpay-method-row ${activePanelMethod === 'wallet' ? 'active' : ''}`}
                  onClick={() => setActivePanelMethod('wallet')}
                >
                  <div className="rzp-row-left">
                    <Wallet size={17} className="text-blue" />
                    <div className="rzp-row-text">
                      <strong>Wallets</strong>
                      <small>Paytm, Amazon Pay, Mobikwik</small>
                    </div>
                  </div>
                </button>
              </div>

              {/* Status Alert Banner (Configuration / Processing) */}
              {errorMessage && (
                <div className="razorpay-error-banner" role="alert">
                  <AlertCircle size={17} className="text-amber" />
                  <div className="error-banner-copy">
                    <strong>Payment Service Unavailable</strong>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Action Button: Pay ₹{total} */}
              <button
                type="button"
                className="razorpay-pay-btn"
                onClick={handlePay}
                disabled={paymentStatus === 'processing'}
              >
                <Lock size={15} />
                <span>
                  {paymentStatus === 'processing' ? 'Processing...' : `Pay ₹${total}`}
                </span>
              </button>

              {/* Secured By Footer */}
              <div className="razorpay-footer-secured">
                <ShieldCheck size={14} className="text-brand-muted" />
                <span>Secured by <strong>Razorpay</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Column 3: Right Order Summary & Trust Reassurance */}
        <section className="payment-right-col">
          <div className="payment-summary-card">
            <div className="summary-header-row">
              <h2 className="summary-title">Order Summary</h2>
              <button
                type="button"
                className="edit-order-btn"
                onClick={() => onNavigate('/order-summary')}
              >
                Edit Order
              </button>
            </div>

            {/* Cart Items List */}
            <div className="summary-items-list">
              {cart.map((item, index) => (
                <div className="summary-item-row" key={`${item.id}-${index}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="summary-item-img"
                    loading="lazy"
                  />
                  <div className="summary-item-details">
                    <strong className="summary-item-name">{item.name}</strong>
                    <small className="summary-item-sub">10&quot; Regular</small>
                    <span className="summary-item-qty">1 × ₹{item.price}</span>
                  </div>
                  <strong className="summary-item-price">₹{item.price}</strong>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="summary-totals-breakdown">
              <div className="totals-line">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="totals-line">
                <span>Delivery Fee <Info size={12} className="text-muted" /></span>
                <span className={deliveryFee === 0 ? 'text-emerald font-bold' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="totals-line">
                <span>Taxes (GST)</span>
                <span>₹{taxes}</span>
              </div>

              <hr className="summary-divider" />

              <div className="totals-line total-amount-row">
                <strong>Total Amount</strong>
                <strong className="total-price-text">₹{total}</strong>
              </div>
            </div>

            {/* Coupon Accordion */}
            <div className="coupon-accordion-wrap">
              <button
                type="button"
                className="coupon-toggle-btn"
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                aria-expanded={isCouponOpen}
              >
                <div className="coupon-toggle-left">
                  <Tag size={15} className="text-brand" />
                  <span>Have a coupon code?</span>
                </div>
                {isCouponOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isCouponOpen && (
                <form onSubmit={handleApplyCoupon} className="coupon-form">
                  <div className="coupon-input-wrap">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="coupon-input"
                    />
                    <button type="submit" className="button button-small coupon-apply-btn">
                      Apply
                    </button>
                  </div>
                  {couponFeedback && (
                    <p className="coupon-feedback-msg">{couponFeedback}</p>
                  )}
                </form>
              )}
            </div>

            {/* Freshness Reassurance Card */}
            <div className="freshness-callout-card">
              <div className="freshness-icon-wrap">
                <Leaf size={16} className="text-emerald" />
              </div>
              <div className="freshness-text-wrap">
                <strong>Freshly Made, Just for You</strong>
                <p>Your order is prepared with the freshest ingredients after payment confirmation.</p>
              </div>
            </div>
          </div>

          {/* Why Choose PizzaDelight Card */}
          <div className="why-choose-card">
            <h3 className="why-choose-title">Why Choose PizzaDelight?</h3>
            <div className="why-choose-grid">
              <div className="why-item">
                <div className="why-icon-circle">
                  <Leaf size={18} className="text-brand" />
                </div>
                <span>Fresh Ingredients</span>
              </div>
              <div className="why-item">
                <div className="why-icon-circle">
                  <ShieldCheck size={18} className="text-brand" />
                </div>
                <span>Secure Payments</span>
              </div>
              <div className="why-item">
                <div className="why-icon-circle">
                  <Truck size={18} className="text-brand" />
                </div>
                <span>On-Time Delivery</span>
              </div>
              <div className="why-item">
                <div className="why-icon-circle">
                  <Heart size={18} className="text-brand" />
                </div>
                <span>Happy Customers</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
