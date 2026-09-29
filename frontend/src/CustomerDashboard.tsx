import { useState, useEffect } from 'react';
import type { Product } from './PizzaDetails';
import { getCurrentUser, getStoredUser, isAuthenticated } from './services/authApi';
import { listMyOrders, BackendOrder } from './services/orderApi';
import { CustomerLayout } from './CustomerLayout';
import {
  Heart,
  ArrowRight,
  Plus,
  Check,
  Clock,
  Crown,
  Gift,
  ChefHat,
  Truck,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

export interface CustomerDashboardProps {
  cartCount?: number;
  cartTotal?: number;
  onCart?: () => void;
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
  products: Product[];
  hideLayout?: boolean;
}

export function CustomerDashboard({
  cartCount = 0,
  cartTotal = 0,
  onCart = () => {},
  onNavigate,
  onAdd,
  products,
  hideLayout = false,
}: CustomerDashboardProps) {
  const [isAuthed, setIsAuthed] = useState(() => isAuthenticated());
  const [displayName, setDisplayName] = useState(() => getStoredUser()?.name || '');
  const [showToast, setShowToast] = useState<string | null>(null);

  const [activeOrder, setActiveOrder] = useState<BackendOrder | null>(null);

  // Derive authenticated customer name and fetch active orders from Express backend
  useEffect(() => {
    const syncAuth = () => {
      const authed = isAuthenticated();
      setIsAuthed(authed);
      if (authed) {
        const stored = getStoredUser();
        if (stored?.name) {
          setDisplayName(stored.name);
        }

        getCurrentUser()
          .then((res) => {
            if (res.success && res.data?.user?.name) {
              setDisplayName(res.data.user.name);
            }
          })
          .catch(() => {});

        listMyOrders()
          .then((res) => {
            if (res.success && res.data?.orders?.length) {
              const active = res.data.orders.find((o) => o.orderStatus !== 'SENT_TO_DELIVERY') || res.data.orders[0];
              setActiveOrder(active);
            }
          })
          .catch(() => {});
      } else {
        setDisplayName('');
        setActiveOrder(null);
      }
    };

    syncAuth();
    window.addEventListener('auth-state-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('auth-state-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const triggerNotice = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleProductAdd = (product: Product) => {
    onAdd(product);
    triggerNotice(`Added ${product.name} to your basket!`);
  };

  // 4 recommended items from existing products array
  const recommendedItems =
    products.length >= 4
      ? products.slice(0, 4)
      : products.concat(products.slice(0, 4 - products.length));

  const dashboardContent = (
    <main className="dashboard-content">
          {/* Toast Notification */}
          {showToast && (
            <div className="dashboard-toast" role="status">
              <CheckCircle2 size={16} />
              <span>{showToast}</span>
            </div>
          )}

          {/* 1. Hero / Welcome Banner */}
          <section className="dashboard-hero-banner" aria-labelledby="dashboard-greeting-title">
            <div className="hero-banner-copy">
              <p className="hero-time-greeting">{isAuthed ? 'Good Evening,' : 'Welcome to'}</p>
              <h1 id="dashboard-greeting-title" className="hero-user-heading">
                {isAuthed ? (displayName ? `${displayName}!` : 'Foodie!') : 'PizzaDelight!'} <span className="wave-hand">🍕</span>
              </h1>
              <p className="hero-subline-1">Craving something delicious today?</p>
              <p className="hero-subline-2">
                Fresh ingredients. Great taste. Happier you.
              </p>
              <div className="hero-banner-actions">
                <button
                  type="button"
                  className="button hero-order-now-btn"
                  onClick={() => onNavigate('/menu')}
                >
                  <span>Order Now</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="button button-light hero-builder-btn"
                  onClick={() => onNavigate('/builder')}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Build Your Own</span>
                </button>
              </div>
            </div>

            <div className="hero-banner-visual">
              <div className="hero-script-card">
                <span className="hero-script-text">
                  Happiness
                  <br />
                  is a slice
                  <br />
                  away <span className="text-red">♥</span>
                </span>
                <span className="hero-script-arrow" aria-hidden="true">⤷</span>
              </div>
              <img
                src="https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Fresh artisan pizza slice cheese pull"
                className="hero-pizza-img"
              />
            </div>
          </section>

          {/* 2. Three Column Information Cards */}
          <div className="dashboard-tri-grid">
            {/* Card 1: Your Active Order */}
            <article className="dashboard-card active-order-card" aria-labelledby="active-order-title">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Heart size={16} className="card-title-icon text-brand" aria-hidden="true" />
                  <h2 id="active-order-title">Your Active Order</h2>
                </div>
                {activeOrder && (
                  <button
                    type="button"
                    className="card-text-link"
                    onClick={() => onNavigate(`/orders/${activeOrder.id || activeOrder._id}`)}
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              {activeOrder ? (
                <>
                  {/* Order Info Row */}
                  <div className="active-order-summary">
                    <div className="order-thumb-wrap">
                      <img
                        src={activeOrder.pizza?.image || "https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200"}
                        alt={activeOrder.pizza?.name || "Custom Pizza"}
                      />
                    </div>
                    <div className="order-details-col">
                      <div className="order-num-status">
                        <strong>Order #{String(activeOrder.id || activeOrder._id).slice(-8).toUpperCase()}</strong>
                        <span className="status-badge-kitchen">{activeOrder.orderStatus.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="order-item-desc">
                        {activeOrder.pizza?.name || `${activeOrder.customization?.base?.name || 'Custom'} Pizza`}
                      </p>
                      <p className="order-item-qty">{activeOrder.quantity} × ₹{activeOrder.totalAmount}</p>
                    </div>
                  </div>

                  {/* Order Stepper Timeline */}
                  <div className="order-timeline" aria-label="Order status timeline">
                    {/* Step 1: Received */}
                    <div className={`timeline-node ${activeOrder.orderStatus === 'ORDER_RECEIVED' ? 'current' : 'complete'}`}>
                      <div className="node-icon-circle">
                        <Check size={14} />
                      </div>
                      <span className="node-label">Order Received</span>
                    </div>
                    <div className={`timeline-connector ${activeOrder.orderStatus !== 'ORDER_RECEIVED' ? 'active' : ''}`} />

                    {/* Step 2: In Kitchen */}
                    <div className={`timeline-node ${activeOrder.orderStatus === 'IN_KITCHEN' ? 'current' : activeOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'complete' : 'upcoming'}`}>
                      <div className="node-icon-circle">
                        <ChefHat size={14} />
                      </div>
                      <span className="node-label">In Kitchen</span>
                    </div>
                    <div className={`timeline-connector ${activeOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'active' : ''}`} />

                    {/* Step 3: Out for Delivery */}
                    <div className={`timeline-node ${activeOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'current' : 'upcoming'}`}>
                      <div className="node-icon-circle">
                        <Truck size={14} />
                      </div>
                      <span className="node-label">Sent to Delivery</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-muted, #777)', marginBottom: '12px', fontSize: '0.9rem' }}>
                    No active orders right now. Ready for fresh pizza?
                  </p>
                  <button
                    type="button"
                    className="button button-small"
                    onClick={() => onNavigate('/menu')}
                  >
                    <span>Browse Menu</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </article>

            {/* Card 2: Quick Actions */}
            <article className="dashboard-card quick-actions-card" aria-labelledby="quick-actions-title">
              <h2 id="quick-actions-title" className="card-plain-title">
                Quick Actions
              </h2>

              <div className="quick-actions-grid">
                {/* 1. Order Now */}
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => onNavigate('/menu')}
                >
                  <div className="action-icon-wrap">
                    <UtensilsCrossed size={18} />
                  </div>
                  <div className="action-text-wrap">
                    <strong>Order Now</strong>
                    <small>Choose from our menu</small>
                  </div>
                </button>

                {/* 2. Build Your Own */}
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => onNavigate('/builder')}
                >
                  <div className="action-icon-wrap">
                    <Sparkles size={18} />
                  </div>
                  <div className="action-text-wrap">
                    <strong>Build Your Own</strong>
                    <small>Create your perfect pizza</small>
                  </div>
                </button>

                {/* 3. Your Favorites */}
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => triggerNotice('Favorites feature coming soon in our next update!')}
                >
                  <div className="action-icon-wrap">
                    <Heart size={18} />
                  </div>
                  <div className="action-text-wrap">
                    <strong>Your Favorites</strong>
                    <small>Quick reorders</small>
                  </div>
                </button>

                {/* 4. Track Order */}
                <button
                  type="button"
                  className="quick-action-btn"
                  onClick={() => onNavigate('/orders')}
                >
                  <div className="action-icon-wrap">
                    <Clock size={18} />
                  </div>
                  <div className="action-text-wrap">
                    <strong>Track Order</strong>
                    <small>Check live status</small>
                  </div>
                </button>
              </div>
            </article>

            {/* Card 3: PizzaDelight Rewards */}
            <article className="dashboard-card rewards-card" aria-labelledby="rewards-card-title">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Crown size={16} className="card-title-icon text-amber" aria-hidden="true" />
                  <h2 id="rewards-card-title">PizzaDelight Rewards</h2>
                </div>
                <button
                  type="button"
                  className="card-text-link"
                  onClick={() => triggerNotice('Rewards program details coming soon!')}
                >
                  <span>View Benefits</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="rewards-content-layout">
                {/* SVG Radial Progress Meter */}
                <div className="rewards-radial-wrap" aria-label="420 out of 500 reward points">
                  <svg className="rewards-progress-svg" viewBox="0 0 100 100">
                    <circle
                      className="radial-bg"
                      cx="50"
                      cy="50"
                      r="40"
                    />
                    <circle
                      className="radial-fill"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeDasharray="251.2"
                      strokeDashoffset="40.2"
                    />
                  </svg>
                  <div className="radial-inner-text">
                    <strong className="radial-score">420</strong>
                    <small className="radial-sub">/ 500 pts</small>
                  </div>
                </div>

                {/* Right Rewards Info */}
                <div className="rewards-info-col">
                  <p className="rewards-next-text">
                    <strong>80 points</strong> to your next reward!
                  </p>
                  <div className="rewards-bar-wrap">
                    <div className="rewards-bar-fill" style={{ width: '84%' }} />
                  </div>

                  {/* Next Reward Callout */}
                  <div className="next-reward-callout">
                    <div className="reward-icon-pill">
                      <Gift size={16} className="text-brand" />
                    </div>
                    <div className="reward-callout-text">
                      <small>Next Reward</small>
                      <strong>Free Garlic Bread</strong>
                    </div>
                    <img
                      src="https://images.pexels.com/photos/1087727/pexels-photo-1087727.jpeg?auto=compress&cs=tinysrgb&h=100&w=100"
                      alt="Garlic Bread"
                      className="reward-thumb-img"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* 3. Recommended for You Section */}
          <section className="dashboard-recommended-section" aria-labelledby="recommended-section-title">
            <div className="section-header-row">
              <div className="section-title-group">
                <Heart size={18} className="text-brand" aria-hidden="true" />
                <h2 id="recommended-section-title">Recommended for You</h2>
                <span className="section-subnote">Based on your taste and order history</span>
              </div>
              <button
                type="button"
                className="card-text-link"
                onClick={() => onNavigate('/menu')}
              >
                <span>View All Pizzas</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="recommended-products-grid">
              {recommendedItems.map((product) => (
                <article key={product.id} className="recommended-product-card">
                  <div
                    className="rec-img-wrap"
                    onClick={() => onNavigate(`/pizza/${product.id}`)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${product.name} details`}
                  >
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </div>
                  <div className="rec-info-wrap">
                    <h3
                      onClick={() => onNavigate(`/pizza/${product.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      {product.name}
                    </h3>
                    <p>{product.description}</p>
                    <div className="rec-footer-row">
                      <strong className="rec-price">₹{product.price}</strong>
                      <button
                        type="button"
                        className="add-button rec-add-btn"
                        onClick={() => handleProductAdd(product)}
                        aria-label={`Add ${product.name} to basket`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 4. Bottom Two-Column Row (Builder Promo + Recent Orders) */}
          <div className="dashboard-bottom-grid">
            {/* Left: Build Your Own Promotional Banner */}
            <article className="builder-promo-banner" aria-labelledby="builder-banner-title">
              <div className="builder-banner-photo-wrap">
                <img
                  src="https://images.pexels.com/photos/35428716/pexels-photo-35428716.jpeg?auto=compress&cs=tinysrgb&h=400&w=400"
                  alt="Fresh pizza dough, herbs, and cheese prepared for baking"
                  loading="lazy"
                />
              </div>

              <div className="builder-banner-copy">
                <p className="eyebrow banner-eyebrow">MAKE IT YOURS</p>
                <h2 id="builder-banner-title">Build Your Own Pizza</h2>
                <p className="banner-description">
                  Choose your base, sauce, cheese and toppings. Create a pizza that&apos;s
                  100% you.
                </p>
                <button
                  type="button"
                  className="button button-light banner-cta-btn"
                  onClick={() => onNavigate('/builder')}
                >
                  <span>Start Building</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>

                <div className="banner-features-grid">
                  <div className="feature-item">
                    <Check size={14} className="feature-check" />
                    <span>4 Simple Steps</span>
                  </div>
                  <div className="feature-item">
                    <Check size={14} className="feature-check" />
                    <span>Fresh Ingredients</span>
                  </div>
                  <div className="feature-item">
                    <Check size={14} className="feature-check" />
                    <span>Real-time Price</span>
                  </div>
                  <div className="feature-item">
                    <Check size={14} className="feature-check" />
                    <span>Made Just for You</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Right: Recent Orders Table */}
            <article className="dashboard-card recent-orders-card" aria-labelledby="recent-orders-title">
              <div className="card-header-row">
                <h2 id="recent-orders-title" className="card-plain-title">
                  Recent Orders
                </h2>
                <button
                  type="button"
                  className="card-text-link"
                  onClick={() => onNavigate('/orders')}
                >
                  <span>View All Orders</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="recent-orders-table-wrap">
                <table className="recent-orders-table">
                  <thead>
                    <tr>
                      <th scope="col">Order ID</th>
                      <th scope="col">Date</th>
                      <th scope="col">Items</th>
                      <th scope="col">Total</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1 */}
                    <tr onClick={() => onNavigate('/orders/PD-2048')}>
                      <td>
                        <strong>#PD-2048</strong>
                      </td>
                      <td>Sep 15, 2026</td>
                      <td>1 item</td>
                      <td>
                        <strong>₹299</strong>
                      </td>
                      <td>
                        <span className="order-status-pill kitchen">In Kitchen</span>
                      </td>
                      <td className="row-arrow-cell">
                        <ArrowRight size={14} aria-hidden="true" />
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr onClick={() => onNavigate('/orders/PD-2017')}>
                      <td>
                        <strong>#PD-2017</strong>
                      </td>
                      <td>Sep 12, 2026</td>
                      <td>2 items</td>
                      <td>
                        <strong>₹648</strong>
                      </td>
                      <td>
                        <span className="order-status-pill delivered">Delivered</span>
                      </td>
                      <td className="row-arrow-cell">
                        <ArrowRight size={14} aria-hidden="true" />
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr onClick={() => onNavigate('/orders/PD-1983')}>
                      <td>
                        <strong>#PD-1983</strong>
                      </td>
                      <td>Sep 08, 2026</td>
                      <td>1 item</td>
                      <td>
                        <strong>₹449</strong>
                      </td>
                      <td>
                        <span className="order-status-pill delivered">Delivered</span>
                      </td>
                      <td className="row-arrow-cell">
                        <ArrowRight size={14} aria-hidden="true" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </main>
  );

  if (hideLayout) {
    return dashboardContent;
  }

  return (
    <CustomerLayout
      activePath="/dashboard"
      onNavigate={onNavigate}
      cartCount={cartCount}
      cartTotal={cartTotal}
      onCart={onCart}
      products={products}
      onAdd={onAdd}
    >
      {dashboardContent}
    </CustomerLayout>
  );
}
