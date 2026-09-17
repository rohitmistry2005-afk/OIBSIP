import { useEffect, useState } from 'react';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { EmailVerification } from './EmailVerification';
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
  FileText,
  Heart,
  Home as HomeIcon,
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
  UserRound,
  Users,
  Utensils,
  X,
} from 'lucide-react';

const photos = {
  hero: 'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  margherita: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  farmhouse: 'https://images.pexels.com/photos/5640034/pexels-photo-5640034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  chicken: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  cheese: 'https://images.pexels.com/photos/34407073/pexels-photo-34407073.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ingredients: 'https://images.pexels.com/photos/35428716/pexels-photo-35428716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

type Product = { id: string; name: string; description: string; price: number; image: string; badge?: string; available: boolean };
const products: Product[] = [
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

function go(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); }
function Logo() { return <button className="logo" onClick={() => go('/')} aria-label="PizzaDelight home"><span className="logo-mark">◒</span><span><strong>PizzaDelight</strong><small>GOOD PIZZA. HAPPIER PEOPLE.</small></span></button>; }

function Header({ cartCount, onCart }: { cartCount: number; onCart: () => void }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="header-inner"><Logo /><nav className={open ? 'nav open' : 'nav'}><button onClick={() => go('/')}>Menu</button><button onClick={() => go('/builder')}>Build Your Own</button><button onClick={() => go('/about')}>About</button><button onClick={() => go('/orders')}>Track Order</button></nav><div className="header-actions"><button className="icon-button search-only" aria-label="Search"><Search size={19} /></button><button className="cart-button" onClick={onCart} aria-label="Open cart"><ShoppingBag size={20} /><span>{cartCount}</span></button><button className="login-link" onClick={() => go('/login')}>Login</button><button className="button button-small" onClick={() => go('/register')}>Sign Up</button></div><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={24} /> : <MenuIcon size={24} />}</button></div></header>;
}
function Button({ children, onClick, variant = 'primary', className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'light'; className?: string }) { return <button onClick={onClick} className={`button button-${variant} ${className}`}>{children}</button>; }
function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) { return <article className="product-card"><div className="product-image" onClick={() => go(`/pizza/${product.id}`)} role="button" tabIndex={0} aria-label={`View ${product.name} details`} style={{ cursor: 'pointer' }}><img src={product.image} alt={product.name} loading="lazy" />{product.badge && <span className="product-badge">{product.badge}</span>}</div><div className="product-info"><h3 onClick={() => go(`/pizza/${product.id}`)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>{product.name}</h3><p>{product.description}</p><div className="product-footer"><strong>₹{product.price}</strong>{product.available ? <button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name}`}><Plus size={20} /></button> : <span className="sold-out">Unavailable</span>}</div></div></article>; }
function Home({ onAdd }: { onAdd: (product: Product) => void }) {
  return <main>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">Fresh ingredients. Real flavours.</p><h1>Your Pizza.<br /><em>Your Way.</em></h1><p className="hero-description">Crafted fresh. Delivered hot. Build your own masterpiece or choose from our chef's specials.</p><div className="hero-actions"><Button onClick={() => go('/menu')}>Order Now <ArrowRight size={17} /></Button><Button variant="outline" onClick={() => go('/builder')}><Palette size={17} /> Build Your Pizza</Button></div><div className="benefits">{benefits.map(([Icon, text]) => <div className="benefit" key={text as string}><Icon size={24} /><span>{text as string}</span></div>)}</div></div><div className="hero-visual"><img src={photos.hero} alt="Fresh artisan pizza with basil and vegetables" /><span className="hand-note">Pizza<br />brings people<br />together <Heart size={17} /></span><div className="fresh-card"><span className="flame">♨</span><span><strong>Hot & Fresh</strong><small>Made with love,<br />served with happiness</small></span></div></div></section>
    <section className="section categories-section"><div className="section-heading"><div><p className="eyebrow">Explore our</p><h2>Popular Categories</h2></div><button className="text-link" onClick={() => go('/menu')}>View Full Menu <ArrowRight size={15} /></button></div><div className="category-row">{categories.map(([name, image]) => <button className="category-card" key={name} onClick={() => go('/menu')}><span><img src={image} alt="" loading="lazy" /></span><strong>{name}</strong></button>)}</div></section>
    <section className="section featured-section"><div className="section-heading"><div><p className="eyebrow">Chef's picks</p><h2>Featured Pizzas</h2></div><button className="text-link" onClick={() => go('/menu')}>View All Pizzas <ArrowRight size={15} /></button></div><div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}</div></section>
    <section className="builder-promo"><div className="builder-photo"><img src={photos.ingredients} alt="Fresh pizza ingredients prepared on a table" loading="lazy" /></div><div className="builder-copy"><p className="eyebrow">Make it yours</p><h2>Build Your Own Pizza</h2><p>Choose your base, sauce, cheese and toppings.<br />Create a pizza that's 100% you.</p><Button variant="light" onClick={() => go('/builder')}>Start Building <ArrowRight size={16} /></Button></div><div className="builder-list"><span><Check size={15} /> 4 Simple Steps</span><span><Check size={15} /> Fresh Ingredients</span><span><Check size={15} /> Real-time Price</span><span><Check size={15} /> Made Just for You</span></div></section>
    <Testimonials />
  </main>;
}
function Testimonials() { const items = [['Riya S.', '“Best pizza in town! Fresh ingredients and super fast delivery.”'], ['Arjun M.', '“The custom pizza builder is amazing! So many options and great taste.”'], ['Neha K.', '“Always consistent quality. My go-to pizza place!”']]; return <section className="section testimonials"><p className="eyebrow">What our customers say</p><div className="section-heading"><h2>Loved by Pizza Lovers</h2><div className="carousel-controls"><button aria-label="Previous"><ChevronLeft size={17} /></button><button aria-label="Next"><ChevronRight size={17} /></button></div></div><div className="testimonial-grid">{items.map(([name, quote], i) => <article className="testimonial-card" key={name}><div className={`avatar avatar-${i}`}><UserRound size={22} /></div><div><p>{quote}</p><strong>{name}</strong><span className="stars">★★★★★</span></div></article>)}</div></section>; }
function Footer() { return <footer><div className="footer-top"><div><Logo /><p>Good pizza. Happier people.</p></div><div><h4>Explore</h4><button onClick={() => go('/menu')}>Our Menu</button><button onClick={() => go('/builder')}>Build Your Own</button><button onClick={() => go('/about')}>Our Story</button></div><div><h4>Customer Care</h4><button onClick={() => go('/orders')}>Track Order</button><button onClick={() => go('/orders')}>My Orders</button><button onClick={() => go('/contact')}>Contact Us</button></div><div><h4>Visit us</h4><p>24, Olive Street<br />Bandra West, Mumbai</p><p className="footer-phone">+91 1800 123 456</p></div></div><div className="footer-bottom"><span>© 2026 PizzaDelight. Made with love.</span><span>Privacy &nbsp; · &nbsp; Terms</span></div></footer>; }

function MenuPage({ onAdd }: { onAdd: (product: Product) => void }) { return <main className="page-shell"><div className="page-intro"><p className="eyebrow">The menu</p><h1>Good food, made<br /><em>for sharing.</em></h1><p>From familiar favourites to new cravings, every pizza is made fresh to order.</p></div><div className="menu-filter"><strong>All Pizzas</strong><button>Veg</button><button>Non-Veg</button><button>Cheese Lovers</button><button className="filter-sort">Sort by <ChevronDown size={15} /></button></div><div className="product-grid menu-grid">{products.concat(products.slice(0, 2)).map((p, i) => <ProductCard key={`${p.id}-${i}`} product={p} onAdd={onAdd} />)}</div></main>; }

function Builder({ onAdd }: { onAdd: (product: Product) => void }) { const [step, setStep] = useState(0); const [selected, setSelected] = useState(['Classic Crust', 'Signature Tomato', 'Fresh Mozzarella', 'Mushrooms, Olives']); const steps = [{ label: 'Base', options: ['Classic Crust', 'Thin & Crispy', 'Cheese Burst'] }, { label: 'Sauce', options: ['Signature Tomato', 'Creamy Alfredo', 'Spicy Peri Peri'] }, { label: 'Cheese', options: ['Fresh Mozzarella', 'Extra Cheese', 'Vegan Cheese'] }, { label: 'Veggies', options: ['Mushrooms, Olives', 'Capsicum, Onions', 'Jalapeños, Corn'] }]; const choose = (value: string) => { const next = [...selected]; next[step] = value; setSelected(next); }; return <main className="builder-page page-shell"><div className="page-intro compact"><p className="eyebrow">Make it yours</p><h1>Build your <em>masterpiece.</em></h1><p>Four simple steps. Endless delicious possibilities.</p></div><div className="builder-layout"><div className="builder-main"><div className="stepper">{steps.map((item, i) => <button className={i === step ? 'active' : i < step ? 'complete' : ''} onClick={() => setStep(i)} key={item.label}><span>{i < step ? <Check size={15} /> : `0${i + 1}`}</span>{item.label}</button>)}</div><div className="builder-option-head"><div><p className="eyebrow">Step 0{step + 1}</p><h2>Choose your {steps[step].label.toLowerCase()}</h2></div><span>{step + 1} of 4</span></div><div className="options-grid">{steps[step].options.map((option, i) => <button className={selected[step] === option ? 'ingredient selected' : 'ingredient'} onClick={() => choose(option)} key={option}><div className={`ingredient-art art-${i}`}><Sparkles size={25} /></div><div><strong>{option}</strong><small>{i === 0 ? 'Our signature choice' : 'A delicious alternative'}</small></div>{selected[step] === option && <span className="checkmark"><Check size={14} /></span>}</button>)}</div><div className="builder-nav"><button className="text-link" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft size={17} /> Back</button><Button onClick={() => step < 3 ? setStep(step + 1) : onAdd({ id: 'custom', name: 'Your Custom Pizza', description: selected.join(' · '), price: 499, image: photos.hero, available: true })}>{step < 3 ? <>Continue <ArrowRight size={16} /></> : <>Add to Cart <ShoppingBag size={16} /></>}</Button></div></div><aside className="builder-summary"><div className="summary-pizza"><img src={photos.hero} alt="Your custom pizza" /></div><p className="eyebrow">Your creation</p><h3>Custom Pizza</h3>{selected.map((item, i) => <div className="summary-line" key={item}><span>{steps[i].label}</span><strong>{item}</strong></div>)}<div className="summary-total"><span>Estimated total</span><strong>₹499</strong></div><small className="summary-note">Final price is confirmed at checkout.</small></aside></div></main>; }

function CartDrawer({ items, onClose, onRemove }: { items: Product[]; onClose: () => void; onRemove: (id: string) => void }) { const total = items.reduce((sum, item) => sum + item.price, 0); return <div className="drawer-backdrop" onClick={onClose}><aside className="cart-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Your basket</p><h2>{items.length} items</h2></div><button onClick={onClose} aria-label="Close cart"><X size={20} /></button></div>{items.length === 0 ? <div className="empty-state"><ShoppingBag size={35} /><h3>Your basket is empty</h3><p>Add a pizza to get started.</p><Button onClick={onClose}>Browse Pizzas</Button></div> : <><div className="cart-items">{items.map((item, i) => <div className="cart-item" key={`${item.id}-${i}`}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>1 × ₹{item.price}</small></div><button onClick={() => onRemove(item.id)}><Minus size={15} /></button></div>)}</div><div className="drawer-total"><span>Subtotal</span><strong>₹{total}</strong></div><Button className="full-button" onClick={() => go('/order-summary')}>Continue to checkout <ArrowRight size={16} /></Button></>}</aside></div>; }

function AuthPage({ register = false }: { register?: boolean }) { return <main className="auth-page"><div className="auth-image"><img src={photos.hero} alt="Fresh PizzaDelight pizza" /><div><Logo /><p>Good pizza.<br /><em>Happier people.</em></p></div></div><div className="auth-form"><button className="back-home" onClick={() => go('/')}><ChevronLeft size={16} /> Back to home</button><div className="form-inner"><p className="eyebrow">{register ? 'Join the family' : 'Welcome back'}</p><h1>{register ? 'Create your account.' : 'Good to see you.'}</h1><p>{register ? 'Save your favourites and track every delicious order.' : 'Log in to see your orders and start your next craving.'}</p>{register && <label>Full name<input placeholder="Your name" /></label>}<label>Email address<input type="email" placeholder="you@example.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label>{!register && <button className="forgot" type="button" onClick={() => go('/forgot-password')}>Forgot password?</button>}<Button className="full-button" onClick={() => go('/menu')}>{register ? 'Create account' : 'Log in'} <ArrowRight size={16} /></Button><div className="form-divider"><span>or continue with</span></div><button className="social-button">Continue with Google</button><p className="switch-auth">{register ? 'Already have an account?' : "Don't have an account?"} <button onClick={() => go(register ? '/login' : '/register')}>{register ? 'Log in' : 'Sign up'}</button></p></div></div></main>; }

function Orders() { return <main className="page-shell orders-page"><div className="page-intro compact"><p className="eyebrow">Your journey</p><h1>Track your <em>orders.</em></h1><p>Every step from our kitchen to your door.</p></div><div className="order-active"><div><span className="status-pill"><span /> In Kitchen</span><h2 onClick={() => go('/orders/PD-2048')} style={{ cursor: 'pointer' }}>Order #PD-2048</h2><p>Your pizza is being made fresh by our kitchen team.</p></div><div className="order-time"><Clock3 size={19} /><strong>Arriving in 18–24 min</strong></div><div className="status-track"><div className="status-step done"><span><Check size={15} /></span><strong>Order Received</strong><small>12:42 PM</small></div><div className="track-line active" /><div className="status-step current"><span><PackageCheck size={16} /></span><strong>In Kitchen</strong><small>Happening now</small></div><div className="track-line" /><div className="status-step"><span>3</span><strong>Sent to Delivery</strong><small>Up next</small></div></div></div><div className="past-orders"><div className="section-heading"><h2>Past orders</h2><button className="text-link" onClick={() => go('/orders/PD-2048')}>View all <ArrowRight size={15} /></button></div>{['#PD-1932 · Farmhouse', '#PD-1877 · Margherita'].map((item, i) => <div className="past-order" key={item} onClick={() => go(i ? '/orders/PD-1877' : '/orders/PD-1932')} style={{ cursor: 'pointer' }}><div><strong>{item}</strong><span>{i ? '18 Aug 2026' : '02 Sep 2026'} · ₹{i ? 299 : 698}</span></div><span className="delivered"><Check size={14} /> Delivered</span><button className="reorder" onClick={(e) => { e.stopPropagation(); go('/menu'); }}>Reorder</button></div>)}</div></main>; }

const adminNavItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'Orders', label: 'Orders', icon: FileText, badge: 12 },
  { id: 'Menu Management', label: 'Menu Management', icon: Utensils },
  { id: 'Inventory', label: 'Inventory', icon: Boxes },
  { id: 'Customers', label: 'Customers', icon: Users },
  { id: 'Offers & Coupons', label: 'Offers & Coupons', icon: Percent },
  { id: 'Reports', label: 'Reports', icon: BarChart3 },
  { id: 'Notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

function Admin() {
  const [tab, setTab] = useState('Dashboard');
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Logo />
        <p className="admin-label">ADMIN PANEL</p>
        <div className="admin-nav-list">
          {adminNavItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              type="button"
              className={tab === id ? 'admin-nav active' : 'admin-nav'}
              onClick={() => setTab(id)}
              key={id}
            >
              <Icon size={17} />
              <span className="admin-nav-label">{label}</span>
              {badge !== undefined && <span className="admin-nav-badge">{badge}</span>}
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
          onClick={() => go('/')}
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
                <p className="eyebrow">Wednesday, 16 September 2026</p>
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
                    ['Today’s Orders', '128', '+12.5%', ShoppingBag],
                    ['Active Orders', '36', '+8.2%', Truck],
                    ['Low Stock Items', '07', 'Needs attention', Leaf],
                    ['Revenue Today', '₹48,690', '+18.4%', Sparkles],
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
                        {[
                          ['#PD-2048', 'Riya Sharma', '₹698', 'In Kitchen'],
                          ['#PD-2047', 'Arjun Mehta', '₹449', 'Received'],
                          ['#PD-2046', 'Neha Kapoor', '₹1,048', 'Delivery'],
                        ].map(row => (
                          <tr
                            key={row[0]}
                            onClick={() => go(`/admin/orders/${row[0].replace('#', '')}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td><strong>{row[0]}</strong></td>
                            <td>{row[1]}</td>
                            <td>{row[2]}</td>
                            <td><span className="table-status">{row[3]}</span></td>
                          </tr>
                        ))}
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
                      {[
                        ['#PD-2048', 'Riya Sharma', '₹698', 'In Kitchen'],
                        ['#PD-2047', 'Arjun Mehta', '₹449', 'Received'],
                        ['#PD-2046', 'Neha Kapoor', '₹1,048', 'Delivery'],
                      ].map(row => (
                        <tr
                          key={row[0]}
                          onClick={() => go(`/admin/orders/${row[0].replace('#', '')}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td><strong>{row[0]}</strong></td>
                          <td>{row[1]}</td>
                          <td>{row[2]}</td>
                          <td><span className="table-status">{row[3]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-empty">
                  <Sparkles size={30} />
                  <h3>{tab} is ready to connect</h3>
                  <p>Mock records are available here while your backend is being connected.</p>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function OrderSummary({ items }: { items: Product[] }) { const total = items.reduce((sum, item) => sum + item.price, 0) || 698; return <main className="page-shell checkout-page"><div className="checkout-steps"><span className="active">01 Basket</span><span>02 Payment</span><span>03 Confirmation</span></div><div className="checkout-layout"><div><p className="eyebrow">Almost there</p><h1>Review your <em>order.</em></h1><div className="checkout-card"><h2>Your pizzas</h2>{(items.length ? items : [products[0], products[1]]).map((item, i) => <div className="checkout-item" key={`${item.id}-${i}`}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>Classic crust · Fresh mozzarella</small><span className="quantity"><button><Minus size={13} /></button> 1 <button><Plus size={13} /></button></span></div><b>₹{item.price}</b></div>)}</div></div><aside className="checkout-summary"><p className="eyebrow">Order total</p><h2>Summary</h2><div><span>Subtotal</span><b>₹{total}</b></div><div><span>Delivery</span><b className="success-text">FREE</b></div><div><span>Taxes</span><b>₹{Math.round(total * .05)}</b></div><hr /><div className="grand-total"><span>Total</span><strong>₹{total + Math.round(total * .05)}</strong></div><Button className="full-button" onClick={() => go('/payment')}>Continue to payment <ArrowRight size={16} /></Button><small className="secure-note"><ShieldCheck size={15} /> Secure checkout powered by Razorpay</small></aside></div></main>; }

function App() { const [path, setPath] = useState(window.location.pathname); const [cart, setCart] = useState<Product[]>([]); const [cartOpen, setCartOpen] = useState(false); useEffect(() => { const listener = () => setPath(window.location.pathname); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); }, []); const add = (product: Product) => setCart(items => [...items, product]); const remove = (id: string) => setCart(items => { const index = items.findIndex(item => item.id === id); return index === -1 ? items : [...items.slice(0, index), ...items.slice(index + 1)]; }); const isAdminOrderDetails = path.startsWith('/admin/orders/') && path.replace('/admin/orders/', '').trim().length > 0; const currentAdminOrderId = isAdminOrderDetails ? path.replace('/admin/orders/', '').split('/')[0] : undefined; if (path === '/admin/login') return <AdminLogin onNavigate={go} />; if (isAdminOrderDetails && currentAdminOrderId) return <AdminOrderDetails orderId={currentAdminOrderId} onNavigate={go} />; if (path.startsWith('/admin')) return <Admin />; if (path === '/dashboard') return <div className="dashboard-shell-container"><CustomerDashboard cartCount={cart.length} cartTotal={cart.reduce((sum, item) => sum + item.price, 0)} onCart={() => setCartOpen(true)} onNavigate={go} onAdd={add} products={products} />{cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onRemove={remove} />}</div>; const isPizza = path.startsWith('/pizza/'); const currentPizza = isPizza ? products.find(p => p.id === path.replace('/pizza/', '').split('/')[0]) : undefined; const isOrderDetails = path.startsWith('/orders/') && path.replace('/orders/', '').trim().length > 0; const currentOrderId = isOrderDetails ? path.replace('/orders/', '').split('/')[0] : undefined; const content = path === '/builder' ? <Builder onAdd={add} /> : path === '/menu' ? <MenuPage onAdd={add} /> : path === '/login' ? <AuthPage /> : path === '/register' ? <AuthPage register /> : path === '/forgot-password' ? <ForgotPassword onNavigate={go} /> : path === '/reset-password' || path.startsWith('/reset-password') ? <ResetPassword onNavigate={go} /> : path === '/verify-email' || path.startsWith('/verify-email') ? <EmailVerification onNavigate={go} /> : isPizza ? <PizzaDetails product={currentPizza} allProducts={products} onAdd={add} onNavigate={go} /> : isOrderDetails && currentOrderId ? <OrderDetails orderId={currentOrderId} onNavigate={go} onAdd={add} allProducts={products} /> : path === '/orders' ? <Orders /> : path === '/profile' ? <Profile onNavigate={go} /> : path === '/order-summary' ? <OrderSummary items={cart} /> : path === '/payment' ? <Payment cart={cart} onNavigate={go} /> : path === '/order-confirmed' ? <main className="confirmation page-shell"><div className="confirmation-mark"><Check size={38} /></div><p className="eyebrow">Payment verified</p><h1>Your pizza is<br /><em>on its way.</em></h1><p>Order #PD-2048 has been sent to our kitchen. We’ll keep you posted as it travels to your door.</p><Button onClick={() => go('/orders')}>Track your order <ArrowRight size={16} /></Button></main> : <Home onAdd={add} />; return <div className="app"><Header cartCount={cart.length} onCart={() => setCartOpen(true)} />{content}<Footer />{cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onRemove={remove} />}</div>; }

export default App;
