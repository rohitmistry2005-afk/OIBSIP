import { useState, useEffect } from 'react';
import type { Product } from './PizzaDetails';
import { supabase } from './services/auth';
import {
  Search,
  Bell,
  ShoppingBag,
  ChevronDown,
  LayoutDashboard,
  UtensilsCrossed,
  Sparkles,
  Receipt,
  Heart,
  User,
  Settings,
  Headphones,
  HelpCircle,
  MessageSquare,
  ArrowRight,
  Plus,
  Check,
  Clock,
  Crown,
  Gift,
  ChefHat,
  Truck,
  Home,
  CheckCircle2,
  X,
  Menu as MenuIcon,
} from 'lucide-react';

interface CustomerDashboardProps {
  cartCount: number;
  cartTotal: number;
  onCart: () => void;
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
  products: Product[];
}

export function CustomerDashboard({
  cartCount,
  cartTotal,
  onCart,
  onNavigate,
  onAdd,
  products,
}: CustomerDashboardProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayName, setDisplayName] = useState('Pizza Lover');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Derive authenticated customer name if available, otherwise neutral fallback
  useEffect(() => {
    const stored =
      localStorage.getItem('pizza_user_name') ||
      sessionStorage.getItem('pizza_user_name');
    if (stored) {
      setDisplayName(stored);
      return;
    }

    if (supabase) {
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (data?.user) {
            const name =
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split('@')[0];
            if (name) {
              setDisplayName(name);
            }
          }
        })
        .catch(() => {
          // Keep neutral fallback on error or no session
        });
    }
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

  return (
    <div className="customer-dashboard">
      {/* Mobile Top Header (<= 720px) */}
      <header className="dashboard-mobile-header">
        <button
          type="button"
          className="dashboard-mobile-menu-btn"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
        <button
          type="button"
          className="logo"
          onClick={() => onNavigate('/')}
          aria-label="PizzaDelight home"
        >
          <span className="logo-mark">◒</span>
          <span>
            <strong>PizzaDelight</strong>
          </span>
        </button>
        <button
          type="button"
          className="cart-button"
          onClick={onCart}
          aria-label={`Open cart with ${cartCount} items`}
        >
          <ShoppingBag size={20} />
          <span>{cartCount}</span>
        </button>
      </header>

      {/* Left Customer Sidebar */}
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        {/* Brand Logo */}
        <div className="dashboard-sidebar-brand">
          <button
            type="button"
            className="logo"
            onClick={() => onNavigate('/')}
            aria-label="PizzaDelight home"
          >
            <span className="logo-mark">◒</span>
            <span>
              <strong>PizzaDelight</strong>
              <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="dashboard-sidebar-nav" aria-label="Customer navigation">
          <button
            type="button"
            className="dashboard-sidebar-item active"
            onClick={() => {
              setMobileNavOpen(false);
              onNavigate('/dashboard');
            }}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              onNavigate('/menu');
            }}
          >
            <UtensilsCrossed size={18} aria-hidden="true" />
            <span>Menu</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              onNavigate('/builder');
            }}
          >
            <Sparkles size={18} aria-hidden="true" />
            <span>Build Your Own</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              onNavigate('/orders');
            }}
          >
            <Receipt size={18} aria-hidden="true" />
            <span>My Orders</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              triggerNotice('Favorites feature coming soon in our next update!');
            }}
          >
            <Heart size={18} aria-hidden="true" />
            <span>Favorites</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              triggerNotice('Account profile management coming soon!');
            }}
          >
            <User size={18} aria-hidden="true" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar-item"
            onClick={() => {
              setMobileNavOpen(false);
              triggerNotice('Settings options coming soon!');
            }}
          >
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Promotional Card */}
        <div className="dashboard-sidebar-promo">
          <div className="promo-illustration">
            <span className="promo-pizza-icon">🍕</span>
            <p className="promo-handwritten">
              Good Food
              <br />
              Brings People
              <br />
              Together <span className="text-brand">♥</span>
            </p>
          </div>
          <div className="promo-photo-wrap">
            <img
              src="https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&h=300&w=300"
              alt="Fresh tomatoes, basil and olive oil"
              loading="lazy"
            />
          </div>
        </div>

        {/* Need Help Section */}
        <div className="dashboard-sidebar-help">
          <p className="help-heading">Need Help?</p>
          <button
            type="button"
            className="help-link-btn"
            onClick={() => triggerNotice('Customer support is available via 1800 123 456')}
          >
            <Headphones size={15} aria-hidden="true" />
            <span>Contact Support</span>
          </button>
          <button
            type="button"
            className="help-link-btn"
            onClick={() => triggerNotice('FAQs are available in our Help Center')}
          >
            <HelpCircle size={15} aria-hidden="true" />
            <span>FAQs</span>
          </button>
          <button
            type="button"
            className="help-link-btn"
            onClick={() => triggerNotice('Live Chat support is active 11 AM - 11 PM')}
          >
            <MessageSquare size={15} aria-hidden="true" />
            <span>Live Chat</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {mobileNavOpen && (
        <div
          className="dashboard-sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right Main Workspace */}
      <div className="dashboard-workspace">
        {/* Top Dashboard Toolbar */}
        <header className="dashboard-topbar">
          {/* Search Box */}
          <div className="dashboard-search-wrap">
            <Search size={18} className="dashboard-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="dashboard-search-input"
              placeholder="Search for pizzas, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search pizzas and categories"
            />
          </div>

          {/* Right Toolbar Actions */}
          <div className="dashboard-topbar-actions">
            {/* Notification Bell */}
            <button
              type="button"
              className="dashboard-notify-btn"
              onClick={() => triggerNotice('You have 2 new kitchen updates!')}
              aria-label="2 notifications"
            >
              <Bell size={19} />
              <span className="notify-badge">2</span>
            </button>

            {/* Cart Pill Button */}
            <button
              type="button"
              className="dashboard-cart-pill"
              onClick={onCart}
              aria-label={`Shopping basket with ${cartCount} items totaling ₹${cartTotal}`}
            >
              <div className="cart-pill-icon-wrap">
                <ShoppingBag size={17} />
                <span className="cart-pill-count">{cartCount}</span>
              </div>
              <strong className="cart-pill-total">
                ₹{cartTotal.toLocaleString('en-IN')}
              </strong>
            </button>

            {/* User Profile Area */}
            <div className="dashboard-user-area" role="group" aria-label="Customer profile">
              <img
                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=100&w=100"
                alt=""
                className="user-avatar-img"
              />
              <div className="user-text-info">
                <span className="user-greeting-name">
                  Hi, {displayName}
                </span>
                <small className="user-role-label">Pizza Lover</small>
              </div>
              <ChevronDown size={14} className="user-chevron" aria-hidden="true" />
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
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
              <p className="hero-time-greeting">Good Evening,</p>
              <h1 id="dashboard-greeting-title" className="hero-user-heading">
                {displayName}! <span className="wave-hand">👋</span>
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
                <button
                  type="button"
                  className="card-text-link"
                  onClick={() => onNavigate('/orders')}
                >
                  <span>View Details</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>

              {/* Order Info Row */}
              <div className="active-order-summary">
                <div className="order-thumb-wrap">
                  <img
                    src="https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200"
                    alt="Margherita Pizza"
                  />
                </div>
                <div className="order-details-col">
                  <div className="order-num-status">
                    <strong>Order #PD-2048</strong>
                    <span className="status-badge-kitchen">In Kitchen</span>
                  </div>
                  <p className="order-item-desc">Margherita (Regular)</p>
                  <p className="order-item-qty">1 × ₹299</p>
                </div>
              </div>

              {/* Order Stepper Timeline */}
              <div className="order-timeline" aria-label="Order status timeline">
                {/* Step 1: Received */}
                <div className="timeline-node complete">
                  <div className="node-icon-circle">
                    <Check size={14} />
                  </div>
                  <span className="node-label">Order Received</span>
                  <small className="node-time">2:15 PM</small>
                </div>
                <div className="timeline-connector active" />

                {/* Step 2: In Kitchen */}
                <div className="timeline-node current">
                  <div className="node-icon-circle">
                    <ChefHat size={14} />
                  </div>
                  <span className="node-label">In Kitchen</span>
                  <small className="node-time">2:32 PM</small>
                </div>
                <div className="timeline-connector" />

                {/* Step 3: Out for Delivery */}
                <div className="timeline-node upcoming">
                  <div className="node-icon-circle">
                    <Truck size={14} />
                  </div>
                  <span className="node-label">Out for Delivery</span>
                </div>
                <div className="timeline-connector" />

                {/* Step 4: Delivered */}
                <div className="timeline-node upcoming">
                  <div className="node-icon-circle">
                    <Home size={14} />
                  </div>
                  <span className="node-label">Delivered</span>
                </div>
              </div>
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
                    <tr onClick={() => onNavigate('/orders')}>
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
                    <tr onClick={() => onNavigate('/orders')}>
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
                    <tr onClick={() => onNavigate('/orders')}>
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
      </div>
    </div>
  );
}
