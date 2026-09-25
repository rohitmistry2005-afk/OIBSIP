import { useEffect, useRef, useState } from 'react';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { EmailVerification } from './EmailVerification';
import { VerifyOtp } from './VerifyOtp';
import { PizzaDetails } from './PizzaDetails';
import { CustomerDashboard } from './CustomerDashboard';
import { Profile } from './Profile';
import { Payment } from './Payment';
import { OrderDetails } from './OrderDetails';
import { AdminLogin } from './AdminLogin';
import { AdminOrderDetails } from './AdminOrderDetails';
import { AdminInventory } from './AdminInventory';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Facebook,
  FileText,
  Gift,
  Heart,
  Home as HomeIcon,
  Instagram,
  Leaf,
  LogOut,
  Menu as MenuIcon,
  Minus,
  PackageCheck,
  Palette,
  Percent,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Twitter,
  UserRound,
  Users,
  Utensils,
  X,
  Youtube,
} from 'lucide-react';
import { listPizzas, getBuilderOptions, BuilderOption, BuilderOptionsData } from './services/productApi';
import { createOrder, listMyOrders, BackendOrder } from './services/orderApi';
import { loginUser, registerUser, isAuthenticated, getStoredUser, logoutUser } from './services/authApi';
import { getAdminOrders, logoutAdmin } from './services/adminApi';

const photos = {
  hero: 'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  margherita: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  farmhouse: 'https://images.pexels.com/photos/5640034/pexels-photo-5640034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  chicken: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  cheese: 'https://images.pexels.com/photos/34407073/pexels-photo-34407073.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ingredients: 'https://images.pexels.com/photos/35428716/pexels-photo-35428716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  available: boolean;
  customization?: {
    base: string;
    sauce: string;
    cheese: string;
    vegetables: string[];
  };
};

const initialProducts: Product[] = [
  { id: 'margherita', name: 'Margherita', description: 'Classic delight with fresh tomatoes, mozzarella and basil.', price: 299, image: photos.margherita, badge: 'Bestseller', available: true },
  { id: 'farmhouse', name: 'Farmhouse', description: 'Onions, capsicum, mushrooms, tomatoes and olives.', price: 349, image: photos.farmhouse, available: true },
  { id: 'chicken', name: 'Chicken Feast', description: 'Grilled chicken, onions, capsicum and mozzarella.', price: 399, image: photos.chicken, available: true },
  { id: 'cheese', name: 'Cheese Burst', description: 'Extra cheese. Extra happiness.', price: 449, image: photos.cheese, badge: 'New', available: true },
];

const categories = [
  ['Classic Pizzas', photos.margherita], ['Veg Pizzas', photos.farmhouse], ['Non-Veg Pizzas', photos.chicken],
  ['Cheese Lovers', photos.cheese], ['Premium Range', photos.hero], ['Sides & Beverages', photos.ingredients],
];
const benefits = [
  [Leaf, 'Fresh Ingredients'], [Truck, 'Fast Delivery'], [ShieldCheck, 'Secure Payments'], [Heart, 'Loved by Thousands'],
];

const CART_STORAGE_KEY = 'pizzadelight_cart';

const defaultCustomPizza: Product = {
  id: 'custom',
  name: 'Your Custom Pizza',
  description: 'Classic Crust · Signature Tomato · Fresh Mozzarella · Mushrooms, Olives',
  price: 499,
  image: photos.hero,
  available: true,
};

function loadInitialCart(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const restored: Product[] = [];
    for (const item of parsed) {
      if (typeof item === 'object' && item !== null && 'id' in item && 'name' in item) {
        restored.push(item as Product);
      } else {
        const id = typeof item === 'string' ? item : null;
        if (id) {
          const found = id === 'custom' ? defaultCustomPizza : initialProducts.find((p) => p.id === id);
          if (found) restored.push(found);
        }
      }
    }
    return restored;
  } catch {
    return [];
  }
}

function go(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

function Logo() {
  return (
    <button className="logo" onClick={() => go('/')} aria-label="PizzaDelight home">
      <span className="logo-mark">◒</span>
      <span>
        <strong>PizzaDelight</strong>
        <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
      </span>
    </button>
  );
}

function Header({
  cartCount,
  onCart,
  products,
  isHome = false,
}: {
  cartCount: number;
  onCart: () => void;
  products: Product[];
  isHome?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [authed, setAuthed] = useState(isAuthenticated());
  const [userName, setUserName] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAuth = () => {
      const isAuth = isAuthenticated();
      setAuthed(isAuth);
      if (isAuth) {
        const user = getStoredUser();
        setUserName(user?.name || null);
      } else {
        setUserName(null);
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

  // Close search on Escape key
  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Close search on click outside
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const filteredProducts = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectProduct = (productId: string) => {
    go(`/pizza/${productId}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      if (!prev) setOpen(false);
      return !prev;
    });
  };

  return (
    <header className={`site-header ${isHome ? 'site-header-home' : ''}`}>
      <div className="header-inner">
        <Logo />
        <nav className={open ? 'nav open' : 'nav'}>
          <button onClick={() => go('/')}>Menu</button>
          <button onClick={() => go('/builder')}>Build Your Own</button>
          <button onClick={() => go('/about')}>About</button>
          <button onClick={() => go('/orders')}>Track Order</button>
        </nav>
        <div className="header-actions">
          <div className="header-search-wrap" ref={searchContainerRef}>
            <button
              className={`icon-button search-only ${searchOpen ? 'active' : ''}`}
              aria-label="Search"
              onClick={handleToggleSearch}
              type="button"
            >
              <Search size={19} />
            </button>
            {searchOpen && (
              <div className="search-popover" role="dialog" aria-label="Search pizzas">
                <div className="search-input-row">
                  <Search size={16} className="search-icon-inside" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="search-input-field"
                    placeholder="Search pizzas (e.g. Margherita, Farmhouse)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search pizza query"
                  />
                  {query && (
                    <button
                      type="button"
                      className="search-action-icon"
                      onClick={() => setQuery('')}
                      aria-label="Clear search text"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="search-action-icon close-search-btn"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="search-dropdown-content">
                  {query.trim().length === 0 ? (
                    <div className="search-empty-hint">
                      <p>Type to search our handcrafted pizzas</p>
                      <div className="search-hint-tags">
                        {products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="search-hint-tag"
                            onClick={() => setQuery(p.name)}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="search-no-matches">
                      <p>No pizzas found for <strong>"{query}"</strong></p>
                      <small>Try checking the spelling or browse our full menu</small>
                    </div>
                  ) : (
                    <div className="search-results-list">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="search-result-row"
                          onClick={() => handleSelectProduct(product.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectProduct(product.id);
                            }
                          }}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="search-result-thumb"
                            loading="lazy"
                          />
                          <div className="search-result-details">
                            <div className="search-result-name-line">
                              <span className="search-result-name">{product.name}</span>
                              {product.badge && (
                                <span className="search-result-badge-pill">{product.badge}</span>
                              )}
                            </div>
                            <p className="search-result-desc-line">{product.description}</p>
                            <span className="search-result-price-tag">₹{product.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="cart-button" onClick={onCart} aria-label="Open cart">
            <ShoppingBag size={20} />
            <span>{cartCount}</span>
          </button>
          {authed ? (
            <>
              <button className="login-link" onClick={() => go('/dashboard')}>
                {userName || 'Dashboard'}
              </button>
              <button
                className="button button-small button-outline"
                onClick={() => {
                  logoutUser();
                  setAuthed(false);
                  go('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="login-link" onClick={() => go('/login')}>
                Login
              </button>
              <button className="button button-small" onClick={() => go('/register')}>
                Sign Up
              </button>
            </>
          )}
        </div>
        <button
          className="mobile-menu"
          onClick={() => {
            setSearchOpen(false);
            setOpen(!open);
          }}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>
    </header>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'light';
  className?: string;
}) {
  return (
    <button onClick={onClick} className={`button button-${variant} ${className}`}>
      {children}
    </button>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <article className="product-card">
      <div
        className="product-image"
        onClick={() => go(`/pizza/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View ${product.name} details`}
        style={{ cursor: 'pointer' }}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-info">
        <h3 onClick={() => go(`/pizza/${product.id}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
          {product.name}
        </h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>₹{product.price}</strong>
          {product.available ? (
            <button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name}`}>
              <Plus size={20} />
            </button>
          ) : (
            <span className="sold-out">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Home({ onAdd, products }: { onAdd: (product: Product) => void; products: Product[] }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Fresh ingredients. Real flavours.</p>
          <h1>
            Your Pizza.<br />
            <em>Your Way.</em>
          </h1>
          <p className="hero-description">
            Crafted fresh. Delivered hot. Build your own masterpiece or choose from our chef's specials.
          </p>
          <div className="hero-actions">
            <Button onClick={() => go('/menu')}>
              Order Now <ArrowRight size={17} />
            </Button>
            <Button variant="outline" onClick={() => go('/builder')}>
              <Palette size={17} /> Build Your Pizza
            </Button>
          </div>
          <div className="benefits">
            {benefits.map(([Icon, text]) => (
              <div className="benefit" key={text as string}>
                <Icon size={24} />
                <span>{text as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <img src={photos.hero} alt="Fresh artisan pizza with basil and vegetables" />
          <span className="hand-note">
            Pizza<br />
            brings people<br />
            together <Heart size={17} />
          </span>
          <div className="fresh-card">
            <span className="flame">♨</span>
            <span>
              <strong>Hot & Fresh</strong>
              <small>Made with love,<br />served with happiness</small>
            </span>
          </div>
        </div>
      </section>
      <section className="section categories-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore our</p>
            <h2>Popular Categories</h2>
          </div>
          <button className="text-link" onClick={() => go('/menu')}>
            View Full Menu <ArrowRight size={15} />
          </button>
        </div>
        <div className="category-row">
          {categories.map(([name, image]) => (
            <button className="category-card" key={name} onClick={() => go('/menu')}>
              <span>
                <img src={image} alt="" loading="lazy" />
              </span>
              <strong>{name}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chef's picks</p>
            <h2>Featured Pizzas</h2>
          </div>
          <button className="text-link" onClick={() => go('/menu')}>
            View All Pizzas <ArrowRight size={15} />
          </button>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={onAdd} />
          ))}
        </div>
      </section>
      <section className="builder-promo">
        <div className="builder-photo">
          <img src={photos.ingredients} alt="Fresh pizza ingredients prepared on a table" loading="lazy" />
        </div>
        <div className="builder-copy">
          <p className="eyebrow">Make it yours</p>
          <h2>Build Your Own Pizza</h2>
          <p>
            Choose your base, sauce, cheese and toppings.<br />
            Create a pizza that's 100% you.
          </p>
          <Button variant="light" onClick={() => go('/builder')}>
            Start Building <ArrowRight size={16} />
          </Button>
        </div>
        <div className="builder-list">
          <span><Check size={15} /> 4 Simple Steps</span>
          <span><Check size={15} /> Fresh Ingredients</span>
          <span><Check size={15} /> Real-time Price</span>
          <span><Check size={15} /> Made Just for You</span>
        </div>
      </section>
      <Testimonials />
    </main>
  );
}

function Testimonials() {
  const items = [
    ['Riya S.', '“Best pizza in town! Fresh ingredients and super fast delivery.”'],
    ['Arjun M.', '“The custom pizza builder is amazing! So many options and great taste.”'],
    ['Neha K.', '“Always consistent quality. My go-to pizza place!”'],
  ];
  return (
    <section className="section testimonials">
      <p className="eyebrow">What our customers say</p>
      <div className="section-heading">
        <h2>Loved by Pizza Lovers</h2>
        <div className="carousel-controls">
          <button aria-label="Previous">
            <ChevronLeft size={17} />
          </button>
          <button aria-label="Next">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="testimonial-grid">
        {items.map(([name, quote], i) => (
          <article className="testimonial-card" key={name}>
            <div className={`avatar avatar-${i}`}>
              <UserRound size={22} />
            </div>
            <div>
              <p>{quote}</p>
              <strong>{name}</strong>
              <span className="stars">★★★★★</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            Crafted with the freshest ingredients, served with love, and made to bring people
            together.
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <button onClick={() => go('/menu')}>Menu</button>
          <button onClick={() => go('/builder')}>Build Your Own</button>
          <button onClick={() => go('/orders')}>Track Order</button>
          <button onClick={() => go('/about')}>About</button>
          <button onClick={() => go('/contact')}>Contact</button>
        </div>
        <div>
          <h4>Help & Support</h4>
          <button onClick={() => go('/about')}>FAQ</button>
          <button onClick={() => go('/about')}>Shipping & Delivery</button>
          <button onClick={() => go('/about')}>Returns & Refunds</button>
          <button onClick={() => go('/about')}>Privacy Policy</button>
          <button onClick={() => go('/about')}>Terms of Service</button>
        </div>
        <div>
          <h4>Follow Us</h4>
          <div className="footer-social-row">
            <button
              type="button"
              className="footer-social-btn"
              aria-label="Instagram"
              onClick={() => window.open('https://instagram.com', '_blank')}
            >
              <Instagram size={16} />
            </button>
            <button
              type="button"
              className="footer-social-btn"
              aria-label="Facebook"
              onClick={() => window.open('https://facebook.com', '_blank')}
            >
              <Facebook size={16} />
            </button>
            <button
              type="button"
              className="footer-social-btn"
              aria-label="Twitter"
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              <Twitter size={16} />
            </button>
            <button
              type="button"
              className="footer-social-btn"
              aria-label="YouTube"
              onClick={() => window.open('https://youtube.com', '_blank')}
            >
              <Youtube size={16} />
            </button>
          </div>
          <div
            className="footer-promo-card"
            onClick={() => go('/menu')}
            role="button"
            tabIndex={0}
            aria-label="Love Pizza? Subscribe for offers"
          >
            <div className="footer-promo-icon" aria-hidden="true">
              <Gift size={16} />
            </div>
            <div className="footer-promo-text">
              <strong>Love Pizza?</strong>
              <small>Subscribe for exclusive offers, new flavors and more!</small>
            </div>
            <ArrowRight size={14} className="footer-promo-arrow" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2024 PizzaDelight. All rights reserved.</span>
        <span>Made with ❤️ for pizza lovers</span>
      </div>
    </footer>
  );
}

function MenuPage({ onAdd, products }: { onAdd: (product: Product) => void; products: Product[] }) {
  return (
    <main className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">The menu</p>
        <h1>
          Good food, made<br />
          <em>for sharing.</em>
        </h1>
        <p>From familiar favourites to new cravings, every pizza is made fresh to order.</p>
      </div>
      <div className="menu-filter">
        <strong>All Pizzas</strong>
        <button>Veg</button>
        <button>Non-Veg</button>
        <button>Cheese Lovers</button>
        <button className="filter-sort">
          Sort by <ChevronDown size={15} />
        </button>
      </div>
      <div className="product-grid menu-grid">
        {products.map((p, i) => (
          <ProductCard key={`${p.id}-${i}`} product={p} onAdd={onAdd} />
        ))}
      </div>
    </main>
  );
}

function Builder({ onAdd }: { onAdd: (product: Product) => void }) {
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<BuilderOptionsData>({
    bases: [
      { id: 'classic', name: 'Classic Thin', price: 120 },
      { id: 'hand-tossed', name: 'Hand Tossed', price: 140 },
      { id: 'whole-wheat', name: 'Whole Wheat', price: 150 },
      { id: 'cheesy-crust', name: 'Cheesy Crust', price: 180 },
      { id: 'gluten-free', name: 'Gluten Free', price: 200 },
    ],
    sauces: [
      { id: 'tomato', name: 'Classic Tomato', price: 0 },
      { id: 'marinara', name: 'Marinara', price: 15 },
      { id: 'pesto', name: 'Basil Pesto', price: 25 },
      { id: 'alfredo', name: 'Creamy Alfredo', price: 30 },
      { id: 'spicy', name: 'Spicy Arrabbiata', price: 20 },
    ],
    cheeses: [
      { id: 'mozzarella', name: 'Mozzarella', price: 0 },
      { id: 'cheddar', name: 'Cheddar', price: 20 },
      { id: 'parmesan', name: 'Parmesan', price: 30 },
      { id: 'gouda', name: 'Smoked Gouda', price: 35 },
    ],
    vegetables: [
      { id: 'onion', name: 'Onion', price: 15 },
      { id: 'capsicum', name: 'Capsicum', price: 15 },
      { id: 'mushroom', name: 'Mushroom', price: 20 },
      { id: 'corn', name: 'Sweet Corn', price: 20 },
      { id: 'olive', name: 'Black Olive', price: 25 },
      { id: 'jalapeno', name: 'Jalapeño', price: 20 },
    ],
  });

  const [selectedBase, setSelectedBase] = useState<BuilderOption>({ id: 'classic', name: 'Classic Thin', price: 120 });
  const [selectedSauce, setSelectedSauce] = useState<BuilderOption>({ id: 'tomato', name: 'Classic Tomato', price: 0 });
  const [selectedCheese, setSelectedCheese] = useState<BuilderOption>({ id: 'mozzarella', name: 'Mozzarella', price: 0 });
  const [selectedVeggies, setSelectedVeggies] = useState<BuilderOption[]>([
    { id: 'onion', name: 'Onion', price: 15 },
    { id: 'capsicum', name: 'Capsicum', price: 15 },
  ]);

  useEffect(() => {
    getBuilderOptions()
      .then((res) => {
        if (res.success && res.data?.options) {
          setOptions(res.data.options);
          if (res.data.options.bases[0]) setSelectedBase(res.data.options.bases[0]);
          if (res.data.options.sauces[0]) setSelectedSauce(res.data.options.sauces[0]);
          if (res.data.options.cheeses[0]) setSelectedCheese(res.data.options.cheeses[0]);
          if (res.data.options.vegetables.length >= 2) {
            setSelectedVeggies([res.data.options.vegetables[0], res.data.options.vegetables[1]]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const stepsMeta = [
    { label: 'Base', options: options.bases },
    { label: 'Sauce', options: options.sauces },
    { label: 'Cheese', options: options.cheeses },
    { label: 'Veggies', options: options.vegetables },
  ];

  const toggleVeggie = (v: BuilderOption) => {
    if (selectedVeggies.some((item) => item.id === v.id)) {
      if (selectedVeggies.length > 1) {
        setSelectedVeggies(selectedVeggies.filter((item) => item.id !== v.id));
      }
    } else {
      if (selectedVeggies.length < 6) {
        setSelectedVeggies([...selectedVeggies, v]);
      }
    }
  };

  const isSelected = (opt: BuilderOption) => {
    if (step === 0) return selectedBase.id === opt.id;
    if (step === 1) return selectedSauce.id === opt.id;
    if (step === 2) return selectedCheese.id === opt.id;
    return selectedVeggies.some((v) => v.id === opt.id);
  };

  const choose = (opt: BuilderOption) => {
    if (step === 0) setSelectedBase(opt);
    else if (step === 1) setSelectedSauce(opt);
    else if (step === 2) setSelectedCheese(opt);
    else toggleVeggie(opt);
  };

  const totalCalculated =
    selectedBase.price +
    selectedSauce.price +
    selectedCheese.price +
    selectedVeggies.reduce((sum, v) => sum + v.price, 0);

  const handleAddToCart = () => {
    onAdd({
      id: 'custom',
      name: 'Your Custom Pizza',
      description: `${selectedBase.name} · ${selectedSauce.name} · ${selectedCheese.name} · ${selectedVeggies.map((v) => v.name).join(', ')}`,
      price: totalCalculated,
      image: photos.hero,
      available: true,
      customization: {
        base: selectedBase.id,
        sauce: selectedSauce.id,
        cheese: selectedCheese.id,
        vegetables: selectedVeggies.map((v) => v.id),
      },
    });
    go('/order-summary');
  };

  return (
    <main className="builder-page page-shell">
      <div className="page-intro compact">
        <p className="eyebrow">Make it yours</p>
        <h1>
          Build your <em>masterpiece.</em>
        </h1>
        <p>Four simple steps. Endless delicious possibilities.</p>
      </div>
      <div className="builder-layout">
        <div className="builder-main">
          <div className="stepper">
            {stepsMeta.map((item, i) => (
              <button
                className={i === step ? 'active' : i < step ? 'complete' : ''}
                onClick={() => setStep(i)}
                key={item.label}
              >
                <span>{i < step ? <Check size={15} /> : `0${i + 1}`}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="builder-option-head">
            <div>
              <p className="eyebrow">Step 0{step + 1}</p>
              <h2>Choose your {stepsMeta[step].label.toLowerCase()}</h2>
            </div>
            <span>{step + 1} of 4</span>
          </div>
          <div className="options-grid">
            {stepsMeta[step].options.map((option, i) => (
              <button
                className={isSelected(option) ? 'ingredient selected' : 'ingredient'}
                onClick={() => choose(option)}
                key={option.id}
              >
                <div className={`ingredient-art art-${i % 4}`}>
                  <Sparkles size={25} />
                </div>
                <div>
                  <strong>{option.name}</strong>
                  <small>
                    ₹{option.price}
                    {option.price === 0 ? ' (Included)' : ''}
                  </small>
                </div>
                {isSelected(option) && (
                  <span className="checkmark">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="builder-nav">
            <button className="text-link" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft size={17} /> Back
            </button>
            <Button onClick={() => (step < 3 ? setStep(step + 1) : handleAddToCart())}>
              {step < 3 ? (
                <>
                  Continue <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Add to Cart <ShoppingBag size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
        <aside className="builder-summary">
          <div className="summary-pizza">
            <img src={photos.hero} alt="Your custom pizza" />
          </div>
          <p className="eyebrow">Your creation</p>
          <h3>Custom Pizza</h3>
          <div className="summary-line">
            <span>Base</span>
            <strong>
              {selectedBase.name} (+₹{selectedBase.price})
            </strong>
          </div>
          <div className="summary-line">
            <span>Sauce</span>
            <strong>
              {selectedSauce.name} (+₹{selectedSauce.price})
            </strong>
          </div>
          <div className="summary-line">
            <span>Cheese</span>
            <strong>
              {selectedCheese.name} (+₹{selectedCheese.price})
            </strong>
          </div>
          <div className="summary-line">
            <span>Veggies</span>
            <strong>
              {selectedVeggies.map((v) => `${v.name} (+₹${v.price})`).join(', ')}
            </strong>
          </div>
          <div className="summary-total">
            <span>Estimated total</span>
            <strong>₹{totalCalculated}</strong>
          </div>
          <small className="summary-note">Final price is validated by backend at checkout.</small>
        </aside>
      </div>
    </main>
  );
}

function CartDrawer({
  items,
  onClose,
  onRemove,
}: {
  items: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Your basket</p>
            <h2>{items.length} items</h2>
          </div>
          <button onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={35} />
            <h3>Your basket is empty</h3>
            <p>Add a pizza to get started.</p>
            <Button onClick={onClose}>Browse Pizzas</Button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, i) => (
                <div className="cart-item" key={`${item.id}-${i}`}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <small>1 × ₹{item.price}</small>
                  </div>
                  <button onClick={() => onRemove(item.id)}>
                    <Minus size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="drawer-total">
              <span>Subtotal</span>
              <strong>₹{total}</strong>
            </div>
            <Button
              className="full-button"
              onClick={() => {
                onClose();
                go('/order-summary');
              }}
            >
              Continue to checkout <ArrowRight size={16} />
            </Button>
          </>
        )}
      </aside>
    </div>
  );
}

function AuthPage({ register = false }: { register?: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (register) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (register) {
        const res = await registerUser({
          name: name.trim(),
          email: trimmedEmail,
          password,
        });
        if (res.success) {
          setSuccessNotice(res.message || 'Registration successful! Check your email to verify your account.');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('pizza_verification_email', trimmedEmail);
          }
          setTimeout(() => {
            if (res.data?.verificationMethod === 'otp' || res.data?.requiresVerification) {
              go(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
            } else {
              go(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
            }
          }, 1500);
        } else {
          setError(res.error || 'Registration failed. Please check your details.');
        }
      } else {
        const res = await loginUser({
          email: trimmedEmail,
          password,
        });
        if (res.success) {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const queryReturnTo = urlParams?.get('returnTo');
          const storedReturnTo = typeof window !== 'undefined' ? sessionStorage.getItem('pizzadelight_redirect_after_auth') : null;
          const returnTo = queryReturnTo || storedReturnTo;
          if (returnTo) {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('pizzadelight_redirect_after_auth');
            }
            go(returnTo);
          } else {
            go('/dashboard');
          }
        } else {
          if (res.status === 403) {
            setError(res.error || res.message || 'Please verify your email address before logging in.');
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('pizza_verification_email', trimmedEmail);
            }
            setTimeout(() => {
              go(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
            }, 1800);
          } else if (res.status === 401) {
            setError(res.error || res.message || 'Invalid email or password.');
          } else if (res.status === 429) {
            setError(res.error || res.message || 'Too many attempts. Please wait a moment before trying again.');
          } else {
            setError(res.error || res.message || 'Unable to log in. Please try again.');
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the backend server. Please verify the API server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-image">
        <img src={photos.hero} alt="Fresh PizzaDelight pizza" />
        <div>
          <Logo />
          <p>
            Good pizza.<br />
            <em>Happier people.</em>
          </p>
        </div>
      </div>
      <div className="auth-form">
        <button className="back-home" onClick={() => go('/')}>
          <ChevronLeft size={16} /> Back to home
        </button>
        <div className="form-inner">
          <p className="eyebrow">{register ? 'Join the family' : 'Welcome back'}</p>
          <h1>{register ? 'Create your account.' : 'Good to see you.'}</h1>
          <p>
            {register
              ? 'Save your favourites and track every delicious order.'
              : 'Log in to see your orders and start your next craving.'}
          </p>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.88rem',
              }}
            >
              {error}
            </div>
          )}

          {successNotice && (
            <div
              style={{
                padding: '10px 14px',
                background: '#dcfce7',
                color: '#15803d',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.88rem',
              }}
            >
              {successNotice}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {register && (
              <label>
                Full name
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="•••••••• (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>
            {!register && (
              <button className="forgot" type="button" onClick={() => go('/forgot-password')}>
                Forgot password?
              </button>
            )}
            <Button className="full-button" onClick={() => {}}>
              {loading ? 'Processing...' : register ? 'Create account' : 'Log in'}{' '}
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="switch-auth" style={{ marginTop: '20px' }}>
            {register ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                const rTo = urlParams?.get('returnTo');
                const suffix = rTo ? `?returnTo=${encodeURIComponent(rTo)}` : '';
                go(register ? `/login${suffix}` : `/register${suffix}`);
              }}
            >
              {register ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function Orders() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyOrders()
      .then((res) => {
        if (res.success && res.data?.orders) {
          setOrders(res.data.orders);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrder = orders.find((o) => o.orderStatus !== 'SENT_TO_DELIVERY') || orders[0];

  return (
    <main className="page-shell orders-page">
      <div className="page-intro compact">
        <p className="eyebrow">Your journey</p>
        <h1>
          Track your <em>orders.</em>
        </h1>
        <p>Every step from our kitchen to your door.</p>
      </div>

      {activeOrder ? (
        <div className="order-active">
          <div>
            <span className="status-pill">
              <span /> {activeOrder.orderStatus.replace(/_/g, ' ')}
            </span>
            <h2
              onClick={() => go(`/orders/${activeOrder.id || activeOrder._id}`)}
              style={{ cursor: 'pointer' }}
            >
              Order #{String(activeOrder.id || activeOrder._id).slice(-8).toUpperCase()}
            </h2>
            <p>
              {activeOrder.pizza?.name || `${activeOrder.customization?.base?.name || 'Custom'} Pizza`} · ₹
              {activeOrder.totalAmount}
            </p>
          </div>
          <div className="order-time">
            <Clock3 size={19} />
            <strong>
              {activeOrder.orderStatus === 'ORDER_RECEIVED'
                ? 'Order received by kitchen'
                : activeOrder.orderStatus === 'IN_KITCHEN'
                ? 'Cooking in kitchen'
                : 'Out for delivery'}
            </strong>
          </div>
          <div className="status-track">
            <div
              className={`status-step ${
                activeOrder.orderStatus === 'ORDER_RECEIVED' ? 'current' : 'done'
              }`}
            >
              <span>
                <Check size={15} />
              </span>
              <strong>Order Received</strong>
            </div>
            <div
              className={`track-line ${
                activeOrder.orderStatus !== 'ORDER_RECEIVED' ? 'active' : ''
              }`}
            />
            <div
              className={`status-step ${
                activeOrder.orderStatus === 'IN_KITCHEN'
                  ? 'current'
                  : activeOrder.orderStatus === 'SENT_TO_DELIVERY'
                  ? 'done'
                  : ''
              }`}
            >
              <span>
                <PackageCheck size={16} />
              </span>
              <strong>In Kitchen</strong>
            </div>
            <div
              className={`track-line ${
                activeOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'active' : ''
              }`}
            />
            <div
              className={`status-step ${
                activeOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'current' : ''
              }`}
            >
              <span>3</span>
              <strong>Sent to Delivery</strong>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p>Loading your orders...</p>
        </div>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted, #777)', marginBottom: '16px' }}>
            You haven't placed any orders yet. Ready for fresh artisan pizza?
          </p>
          <Button onClick={() => go('/menu')}>
            Order Now <ArrowRight size={16} />
          </Button>
        </div>
      )}

      <div className="past-orders">
        <div className="section-heading">
          <h2>Order history</h2>
        </div>
        {orders.length > 0 ? (
          orders.map((item) => (
            <div
              className="past-order"
              key={item.id || item._id}
              onClick={() => go(`/orders/${item.id || item._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>
                  #{String(item.id || item._id).slice(-8).toUpperCase()} ·{' '}
                  {item.pizza?.name || 'Custom Pizza'}
                </strong>
                <span>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · ₹{item.totalAmount}
                </span>
              </div>
              <span className="delivered">
                <Check size={14} /> {item.orderStatus.replace(/_/g, ' ')}
              </span>
              <button
                className="reorder"
                onClick={(e) => {
                  e.stopPropagation();
                  go('/menu');
                }}
              >
                Reorder
              </button>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--color-text-muted, #777)', padding: '12px 0' }}>
            No past order history found.
          </p>
        )}
      </div>
    </main>
  );
}

const adminNavItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'Orders', label: 'Orders', icon: FileText },
  { id: 'Menu Management', label: 'Menu Management', icon: Utensils },
  { id: 'Inventory', label: 'Inventory', icon: Boxes },
  { id: 'Customers', label: 'Customers', icon: Users },
  { id: 'Offers & Coupons', label: 'Offers & Coupons', icon: Percent },
  { id: 'Reports', label: 'Reports', icon: BarChart3 },
  { id: 'Notifications', label: 'Notifications', icon: Bell },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

function Admin() {
  const [tab, setTab] = useState('Dashboard');
  const [orders, setOrders] = useState<BackendOrder[]>([]);

  useEffect(() => {
    getAdminOrders()
      .then((res) => {
        if (res.success && res.data?.orders) {
          setOrders(res.data.orders);
        }
      })
      .catch(() => {});
  }, []);

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.paymentStatus === 'SUCCESS' ? o.totalAmount : 0),
    0
  );
  const activeOrders = orders.filter((o) => o.orderStatus !== 'SENT_TO_DELIVERY');

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Logo />
        <p className="admin-label">ADMIN PANEL</p>
        <div className="admin-nav-list">
          {adminNavItems.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              className={tab === id ? 'admin-nav active' : 'admin-nav'}
              onClick={() => setTab(id)}
              key={id}
            >
              <Icon size={17} />
              <span className="admin-nav-label">{label}</span>
              {id === 'Orders' && orders.length > 0 && (
                <span className="admin-nav-badge">{orders.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="admin-sidebar-promo-card">
          <div className="promo-card-copy">
            <p className="promo-headline">
              Fresh Ingredients<br />
              Great Pizzas<br />
              Happier People <span className="promo-heart">♥</span>
            </p>
          </div>
          <div className="promo-card-img-wrap">
            <img
              src="https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=200&w=200"
              alt="Fresh artisanal pizza"
              loading="lazy"
            />
          </div>
          <p className="promo-subnote">Stock smart.<br />Serve better.</p>
        </div>
        <button
          type="button"
          className="admin-nav admin-logout-btn"
          onClick={() => {
            logoutAdmin();
            go('/admin/login');
          }}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </aside>
      <section className={`admin-content ${tab === 'Inventory' ? 'inventory-content' : ''}`}>
        {tab === 'Inventory' ? (
          <AdminInventory onNavigate={go} />
        ) : (
          <>
            <div className="admin-top">
              <div>
                <p className="eyebrow">Operations Portal</p>
                <h1>{tab}</h1>
              </div>
              <div className="admin-user">
                <span className="admin-avatar">AD</span>
                <span>
                  <strong>Admin</strong>
                  <small>Operations</small>
                </span>
                <ChevronDown size={16} />
              </div>
            </div>
            {tab === 'Dashboard' ? (
              <>
                <div className="stats-grid">
                  {[
                    ['Total Orders', String(orders.length), 'All recorded', ShoppingBag],
                    ['Active Orders', String(activeOrders.length), 'Live in kitchen', Truck],
                    ['Completed Orders', String(orders.length - activeOrders.length), 'Delivered', Leaf],
                    ['Revenue Recorded', `₹${totalRevenue}`, 'Verified transactions', Sparkles],
                  ].map(([label, value, change, Icon]) => (
                    <div className="stat-card" key={label as string}>
                      <div className="stat-icon"><Icon size={19} /></div>
                      <span>{label as string}</span>
                      <strong>{value as string}</strong>
                      <small className="positive">{change as string}</small>
                    </div>
                  ))}
                </div>
                <div className="admin-panels">
                  <div className="admin-panel">
                    <div className="panel-head">
                      <div>
                        <p className="eyebrow">Live operations</p>
                        <h2>Recent orders</h2>
                      </div>
                      <button className="text-link" onClick={() => setTab('Orders')}>
                        View all <ArrowRight size={15} />
                      </button>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length > 0 ? (
                          orders.slice(0, 5).map((ord) => {
                            const orderId = String(ord.id || ord._id);
                            const customerName =
                              typeof ord.user === 'object' && ord.user?.name
                                ? ord.user.name
                                : 'Customer';
                            return (
                              <tr
                                key={orderId}
                                onClick={() => go(`/admin/orders/${orderId}`)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>
                                  <strong>#{orderId.slice(-8).toUpperCase()}</strong>
                                </td>
                                <td>{customerName}</td>
                                <td>₹{ord.totalAmount}</td>
                                <td>
                                  <span className="table-status">
                                    {ord.orderStatus.replace(/_/g, ' ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                              No orders received yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="admin-panel prep-panel">
                    <p className="eyebrow">Kitchen pulse</p>
                    <h2>Orders are moving smoothly.</h2>
                    <div className="pulse-chart">
                      <span style={{ height: '38%' }} />
                      <span style={{ height: '60%' }} />
                      <span style={{ height: '45%' }} />
                      <span style={{ height: '80%' }} />
                      <span style={{ height: '68%' }} />
                      <span style={{ height: '92%' }} />
                      <span style={{ height: '72%' }} />
                    </div>
                    <small>Average prep time <strong>14 mins</strong></small>
                  </div>
                </div>
              </>
            ) : (
              <div className="admin-panel full-panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Operations</p>
                    <h2>{tab} overview</h2>
                  </div>
                  <Button><Plus size={16} /> Add new</Button>
                </div>
                <div style={{ margin: '16px 0', overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length > 0 ? (
                        orders.map((ord) => {
                          const orderId = String(ord.id || ord._id);
                          const customerName =
                            typeof ord.user === 'object' && ord.user?.name
                              ? ord.user.name
                              : 'Customer';
                          return (
                            <tr
                              key={orderId}
                              onClick={() => go(`/admin/orders/${orderId}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <strong>#{orderId.slice(-8).toUpperCase()}</strong>
                              </td>
                              <td>{customerName}</td>
                              <td>₹{ord.totalAmount}</td>
                              <td>
                                <span className="table-status">
                                  {ord.orderStatus.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function OrderSummary({ items }: { items: Product[]; products: Product[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const displayItems = items.length ? items : [];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handleProceedToPayment = async () => {
    if (items.length === 0) {
      go('/menu');
      return;
    }

    if (!isAuthenticated()) {
      sessionStorage.setItem('pizzadelight_redirect_after_auth', '/order-summary');
      go('/login');
      return;
    }

    setSubmitting(true);
    setOrderError(null);

    try {
      const firstItem = items[0];
      const pizzaId = firstItem && firstItem.id !== 'custom' && /^[0-9a-fA-F]{24}$/.test(firstItem.id) ? firstItem.id : null;
      const customization = firstItem?.customization || {
        base: 'classic',
        sauce: 'tomato',
        cheese: 'mozzarella',
        vegetables: ['onion', 'capsicum'],
      };

      const res = await createOrder({
        pizzaId,
        customization,
        quantity: items.length,
      });

      if (res.success && res.data?.order) {
        const orderId = res.data.order.id || res.data.order._id;
        sessionStorage.setItem('pizzadelight_current_order_id', String(orderId));
        go(`/payment?orderId=${orderId}`);
      } else {
        setOrderError(res.error || 'Failed to create order on backend. Please retry.');
      }
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Network error creating order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell checkout-page">
      <div className="checkout-steps">
        <span className="active">01 Basket</span>
        <span>02 Payment</span>
        <span>03 Confirmation</span>
      </div>
      <div className="checkout-layout">
        <div>
          <p className="eyebrow">Almost there</p>
          <h1>Review your <em>order.</em></h1>
          {orderError && (
            <div
              style={{
                padding: '12px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {orderError}
            </div>
          )}
          <div className="checkout-card">
            <h2>Your pizzas</h2>
            {displayItems.length > 0 ? (
              displayItems.map((item, i) => (
                <div className="checkout-item" key={`${item.id}-${i}`}>
                  <img src={item.image} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </div>
                  <b>₹{item.price}</b>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p>Your basket is empty. Add a pizza to proceed.</p>
                <Button onClick={() => go('/menu')}>Browse Menu</Button>
              </div>
            )}
          </div>
        </div>
        <aside className="checkout-summary">
          <p className="eyebrow">Order total</p>
          <h2>Summary</h2>
          <div>
            <span>Subtotal</span>
            <b>₹{total}</b>
          </div>
          <div>
            <span>Delivery</span>
            <b className="success-text">FREE</b>
          </div>
          <div>
            <span>Taxes (5% GST)</span>
            <b>₹{Math.round(total * 0.05)}</b>
          </div>
          <hr />
          <div className="grand-total">
            <span>Total</span>
            <strong>₹{total + Math.round(total * 0.05)}</strong>
          </div>
          <Button className="full-button" onClick={handleProceedToPayment}>
            {submitting ? 'Creating order...' : 'Continue to payment'}{' '}
            <ArrowRight size={16} />
          </Button>
          <small className="secure-note">
            <ShieldCheck size={15} /> Secure checkout powered by Razorpay
          </small>
        </aside>
      </div>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<Product[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const listener = () => setPath(window.location.pathname);
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);

  // Fetch backend pizzas on mount
  useEffect(() => {
    listPizzas()
      .then((res) => {
        if (res.success && res.data?.pizzas?.length) {
          const mapped: Product[] = res.data.pizzas.map((p) => ({
            id: p._id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image || photos.margherita,
            available: p.available,
          }));
          setProducts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // safely ignore storage write errors
    }
  }, [cart]);

  const add = (product: Product) => setCart((items) => [...items, product]);
  const remove = (id: string) =>
    setCart((items) => {
      const index = items.findIndex((item) => item.id === id);
      return index === -1 ? items : [...items.slice(0, index), ...items.slice(index + 1)];
    });
  const clearCart = () => {
    setCart([]);
    setCartOpen(false);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // safely ignore storage write errors
    }
  };

  useEffect(() => {
    if (path === '/order-confirmed' && cart.length > 0) {
      clearCart();
    }
  }, [path, cart.length]);

  const isAdminOrderDetails =
    path.startsWith('/admin/orders/') &&
    path.replace('/admin/orders/', '').trim().length > 0;
  const currentAdminOrderId = isAdminOrderDetails
    ? path.replace('/admin/orders/', '').split('/')[0]
    : undefined;

  if (path === '/admin/login') return <AdminLogin onNavigate={go} />;
  if (isAdminOrderDetails && currentAdminOrderId)
    return <AdminOrderDetails orderId={currentAdminOrderId} onNavigate={go} />;
  if (path.startsWith('/admin')) return <Admin />;
  if (path === '/dashboard')
    return (
      <div className="dashboard-shell-container">
        <CustomerDashboard
          cartCount={cart.length}
          cartTotal={cart.reduce((sum, item) => sum + item.price, 0)}
          onCart={() => setCartOpen(true)}
          onNavigate={go}
          onAdd={add}
          products={products}
        />
        {cartOpen && (
          <CartDrawer items={cart} onClose={() => setCartOpen(false)} onRemove={remove} />
        )}
      </div>
    );

  const isPizza = path.startsWith('/pizza/');
  const currentPizza = isPizza
    ? products.find((p) => p.id === path.replace('/pizza/', '').split('/')[0])
    : undefined;

  const isOrderDetails =
    path.startsWith('/orders/') && path.replace('/orders/', '').trim().length > 0;
  const currentOrderId = isOrderDetails ? path.replace('/orders/', '').split('/')[0] : undefined;

  const confirmedOrderId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('orderId') ||
        sessionStorage.getItem('pizzadelight_confirmed_order_id') ||
        'PD-2048'
      : 'PD-2048';

  const content =
    path === '/builder' ? (
      <Builder onAdd={add} />
    ) : path === '/menu' ? (
      <MenuPage onAdd={add} products={products} />
    ) : path === '/login' ? (
      <AuthPage />
    ) : path === '/register' || path === '/signup' ? (
      <AuthPage register />
    ) : path === '/forgot-password' ? (
      <ForgotPassword onNavigate={go} />
    ) : path === '/reset-password' || path.startsWith('/reset-password') ? (
      <ResetPassword onNavigate={go} />
    ) : path === '/verify-email' || path.startsWith('/verify-email') ? (
      <EmailVerification onNavigate={go} />
    ) : path === '/verify-otp' || path.startsWith('/verify-otp') ? (
      <VerifyOtp onNavigate={go} />
    ) : isPizza ? (
      <PizzaDetails
        product={currentPizza}
        allProducts={products}
        onAdd={add}
        onNavigate={go}
      />
    ) : isOrderDetails && currentOrderId ? (
      <OrderDetails
        orderId={currentOrderId}
        onNavigate={go}
        onAdd={add}
        allProducts={products}
      />
    ) : path === '/orders' ? (
      <Orders />
    ) : path === '/profile' ? (
      <Profile onNavigate={go} />
    ) : path === '/order-summary' ? (
      <OrderSummary items={cart} products={products} />
    ) : path === '/payment' ? (
      <Payment cart={cart} onNavigate={go} onClearCart={clearCart} />
    ) : path === '/order-confirmed' ? (
      <main className="confirmation page-shell">
        <div className="confirmation-mark">
          <Check size={38} />
        </div>
        <p className="eyebrow">Payment verified</p>
        <h1>
          Your pizza is<br />
          <em>on its way.</em>
        </h1>
        <p>
          Order #{confirmedOrderId.slice(-8).toUpperCase()} has been confirmed and sent to our kitchen.
        </p>
        <Button onClick={() => go(`/orders/${confirmedOrderId}`)}>
          Track your order <ArrowRight size={16} />
        </Button>
      </main>
    ) : (
      <Home onAdd={add} products={products} />
    );

  return (
    <div className="app">
      <Header
        cartCount={cart.length}
        onCart={() => setCartOpen(true)}
        products={products}
        isHome={path === '/' || path === '' || path === '/about'}
      />
      {content}
      <Footer />
      {cartOpen && (
        <CartDrawer items={cart} onClose={() => setCartOpen(false)} onRemove={remove} />
      )}
    </div>
  );
}

export default App;
