import { useState, useEffect, useRef } from 'react';
import type { Product } from './PizzaDetails';
import { getCurrentUser, getStoredUser, logoutUser, isAuthenticated } from './services/authApi';
import {
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
  Search,
  Bell,
  ShoppingBag,
  ChevronDown,
  CheckCircle2,
  Info,
  X,
  Menu as MenuIcon,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export interface CustomerLayoutProps {
  activePath: string;
  onNavigate: (path: string) => void;
  cartCount: number;
  cartTotal: number;
  onCart: () => void;
  products?: Product[];
  onAdd?: (product: Product) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function CustomerLayout({
  activePath,
  onNavigate,
  cartCount,
  cartTotal,
  onCart,
  products = [],
  onAdd,
  onLogout,
  children,
}: CustomerLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(() => isAuthenticated());
  const [displayName, setDisplayName] = useState(() => getStoredUser()?.name || '');
  const [userEmail, setUserEmail] = useState(() => getStoredUser()?.email || '');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync user profile from auth store or API
  useEffect(() => {
    const syncAuth = () => {
      const authed = isAuthenticated();
      setIsAuthed(authed);
      if (authed) {
        const stored = getStoredUser();
        if (stored?.name) setDisplayName(stored.name);
        if (stored?.email) setUserEmail(stored.email);

        getCurrentUser()
          .then((res) => {
            if (res.success && res.data?.user) {
              if (res.data.user.name) setDisplayName(res.data.user.name);
              if (res.data.user.email) setUserEmail(res.data.user.email);
            }
          })
          .catch(() => {});
      } else {
        setDisplayName('');
        setUserEmail('');
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 2500);
  };

  // Search filtering
  const matchingProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

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

      {/* Static Left Sidebar */}
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
            className={`dashboard-sidebar-item ${activePath === '/dashboard' ? 'active' : ''}`}
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
            className={`dashboard-sidebar-item ${activePath === '/menu' ? 'active' : ''}`}
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
            className={`dashboard-sidebar-item ${activePath === '/builder' ? 'active' : ''}`}
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
            className={`dashboard-sidebar-item ${
              activePath === '/orders' || activePath.startsWith('/orders/') ? 'active' : ''
            }`}
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
            className={`dashboard-sidebar-item ${activePath === '/profile' ? 'active' : ''}`}
            onClick={() => {
              setMobileNavOpen(false);
              onNavigate('/profile');
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
          <div className="dashboard-search-wrap" ref={searchWrapRef}>
            <Search size={18} className="dashboard-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="dashboard-search-input"
              placeholder="Search for pizzas, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              aria-label="Search pizzas and categories"
            />
            {/* Search Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="dashboard-search-results-dropdown">
                {matchingProducts.length === 0 ? (
                  <div className="search-no-results">
                    <p>No pizzas found for "{searchQuery}"</p>
                  </div>
                ) : (
                  matchingProducts.map((p) => (
                    <div
                      key={p.id}
                      className="dashboard-search-result-row"
                      onClick={() => {
                        setSearchFocused(false);
                        setSearchQuery('');
                        onNavigate(`/pizza/${p.id}`);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <img src={p.image} alt={p.name} className="search-result-thumb" />
                      <div className="search-result-info">
                        <strong>{p.name}</strong>
                        <span className="search-result-price">₹{p.price}</span>
                      </div>
                      {onAdd && (
                        <button
                          type="button"
                          className="search-quick-add"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdd(p);
                            triggerNotice(`Added ${p.name} to basket!`);
                          }}
                          aria-label={`Add ${p.name}`}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="dashboard-topbar-actions">
            {/* Cart Pill Button - always accessible for both guest and authenticated user */}
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

            {isAuthed ? (
              <>
                {/* Notification Bell (Only for authenticated user) */}
                <button
                  type="button"
                  className="dashboard-notify-btn"
                  onClick={() => triggerNotice('No new notifications')}
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                </button>

                {/* User Profile Area with dropdown */}
                <div className="dashboard-user-area-wrapper" ref={userMenuRef}>
                  <div
                    className="dashboard-user-area"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    role="button"
                    tabIndex={0}
                    aria-label="View Customer profile and options"
                  >
                    <img
                      src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=100&w=100"
                      alt=""
                      className="user-avatar-img"
                    />
                    <div className="user-text-info">
                      <span className="user-greeting-name">
                        Hi, {displayName || 'Customer'}
                      </span>
                      <small className="user-role-label">Member</small>
                    </div>
                    <ChevronDown size={14} className="user-chevron" aria-hidden="true" />
                  </div>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="dashboard-user-dropdown" role="menu">
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-name">{displayName || 'Customer'}</div>
                        <div className="user-dropdown-email">{userEmail || 'customer@pizzadelight.com'}</div>
                      </div>
                      <div className="user-dropdown-divider" />
                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/profile');
                        }}
                        role="menuitem"
                      >
                        <User size={15} />
                        <span>My Profile</span>
                      </button>
                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/orders');
                        }}
                        role="menuitem"
                      >
                        <Receipt size={15} />
                        <span>My Orders</span>
                      </button>
                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/about');
                        }}
                        role="menuitem"
                      >
                        <Info size={15} />
                        <span>About PizzaDelight</span>
                      </button>
                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/admin');
                        }}
                        role="menuitem"
                      >
                        <Settings size={15} />
                        <span>Admin Portal</span>
                      </button>
                      <div className="user-dropdown-divider" />
                      <button
                        type="button"
                        className="user-dropdown-item danger"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logoutUser();
                          onLogout?.();
                          onNavigate('/');
                        }}
                        role="menuitem"
                      >
                        <LogOut size={15} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Guest State: Login and Sign Up buttons */}
                <button
                  type="button"
                  className="login-link dashboard-auth-login-link"
                  onClick={() => onNavigate('/login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="button button-small dashboard-auth-signup-btn"
                  onClick={() => onNavigate('/register')}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </header>

        {/* Toast Notification */}
        {toastNotice && (
          <div className="dashboard-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{toastNotice}</span>
          </div>
        )}

        {/* Workspace Content */}
        {children}
      </div>
    </div>
  );
}
