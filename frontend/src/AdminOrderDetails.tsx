import { useState, useEffect } from 'react';
import { getAdminOrder, updateOrderStatus, logoutAdmin } from './services/adminApi';
import { BackendOrder } from './services/orderApi';
import {
  ArrowLeft,
  Bell,
  Bike,
  BookOpen,
  Check,
  ChefHat,
  ChevronDown,
  CreditCard,
  Home,
  Info,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  variant: string;
  customizationType: string;
  customizationDetails: string;
  price: number;
  quantity: number;
  image: string;
}

interface AdminOrderData {
  id: string;
  rawId: string;
  placedDate: string;
  status: 'Delivered' | 'In Kitchen' | 'Received' | 'Out for Delivery';
  timeline: {
    step: string;
    title: string;
    time: string;
    completed: boolean;
    icon: 'cart' | 'confirm' | 'kitchen' | 'delivery' | 'delivered';
  }[];
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  totalPaid: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    badge?: string;
    memberSince: string;
    totalOrders: number;
  };
  delivery: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    deliveredAt: string;
    partnerName: string;
    partnerPhone: string;
    partnerAvatar: string;
  };
  payment: {
    method: string;
    status: string;
    amount: number;
    referenceId: string;
    paidOn: string;
  };
  notes: {
    id: string;
    author: string;
    time: string;
    text: string;
  }[];
}

interface AdminOrderDetailsProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export function AdminOrderDetails({ orderId, onNavigate }: AdminOrderDetailsProps) {
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notesList, setNotesList] = useState<AdminOrderData['notes'] | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [backendOrder, setBackendOrder] = useState<BackendOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);
    getAdminOrder(orderId)
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data?.order) {
            setBackendOrder(res.data.order);
            setNextStatus(res.data.nextStatus);
          } else {
            setFetchError(res.error || 'Order not found in database.');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err instanceof Error ? err.message : 'Network error loading order.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const triggerNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3800);
  };

  // Map real backend order to presentation format
  const order: AdminOrderData | null = backendOrder
    ? {
        id: String(backendOrder.id || backendOrder._id).slice(-8).toUpperCase(),
        rawId: String(backendOrder.id || backendOrder._id),
        placedDate: new Date(backendOrder.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        status:
          backendOrder.orderStatus === 'ORDER_RECEIVED'
            ? 'Received'
            : backendOrder.orderStatus === 'IN_KITCHEN'
            ? 'In Kitchen'
            : 'Out for Delivery',
        timeline: [
          {
            step: '1',
            title: 'Order Received',
            time: new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
            icon: 'cart',
          },
          {
            step: '2',
            title: 'In the Kitchen',
            time: backendOrder.orderStatus !== 'ORDER_RECEIVED' ? 'In Progress' : 'Pending',
            completed: backendOrder.orderStatus === 'IN_KITCHEN' || backendOrder.orderStatus === 'SENT_TO_DELIVERY',
            icon: 'kitchen',
          },
          {
            step: '3',
            title: 'Out for Delivery',
            time: backendOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'Dispatched' : 'Pending',
            completed: backendOrder.orderStatus === 'SENT_TO_DELIVERY',
            icon: 'delivery',
          },
        ],
        items: [
          {
            id: String(backendOrder.id || backendOrder._id),
            name: backendOrder.pizza?.name || 'Custom Artisan Pizza',
            variant: `${backendOrder.customization?.base?.name || 'Classic'} Crust`,
            customizationType: backendOrder.customization?.cheese?.name || 'Mozzarella',
            customizationDetails: `Sauce: ${backendOrder.customization?.sauce?.name || 'Tomato'}${
              backendOrder.customization?.vegetables?.length
                ? ` · Veggies: ${backendOrder.customization.vegetables.map((v) => v.name).join(', ')}`
                : ''
            }`,
            price: Math.round(
              (backendOrder.totalAmount - Math.round((backendOrder.totalAmount * 5) / 105)) /
                (backendOrder.quantity || 1)
            ),
            quantity: backendOrder.quantity || 1,
            image:
              backendOrder.pizza?.image ||
              'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
          },
        ],
        subtotal: backendOrder.totalAmount - Math.round((backendOrder.totalAmount * 5) / 105),
        deliveryFee: 0,
        taxes: Math.round((backendOrder.totalAmount * 5) / 105),
        totalPaid: backendOrder.totalAmount,
        customer: {
          name:
            typeof backendOrder.user === 'object' && backendOrder.user?.name
              ? backendOrder.user.name
              : 'Customer',
          email:
            typeof backendOrder.user === 'object' && backendOrder.user?.email
              ? backendOrder.user.email
              : 'customer@pizzadelight.com',
          phone: '+91 98765 43210',
          badge: backendOrder.paymentStatus === 'SUCCESS' ? 'Verified' : 'Guest',
          memberSince: '2026',
          totalOrders: 1,
        },
        delivery: {
          addressLine1: 'Customer delivery address',
          addressLine2: 'Express dispatch',
          city: 'Local Delivery Zone',
          deliveredAt: backendOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'En Route with Fleet' : 'Kitchen Preparation',
          partnerName: 'Fleet Rider',
          partnerPhone: '+91 91234 56789',
          partnerAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
        },
        payment: {
          method: backendOrder.paymentStatus === 'SUCCESS' ? 'Razorpay' : 'Pending Verification',
          status: backendOrder.paymentStatus,
          amount: backendOrder.totalAmount,
          referenceId: backendOrder.razorpayPaymentId || backendOrder.razorpayOrderId || 'N/A',
          paidOn: new Date(backendOrder.createdAt).toLocaleString(),
        },
        notes: [
          {
            id: 'note-init',
            author: 'System',
            time: new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Order created with payment status: ${backendOrder.paymentStatus}. Initial status: ${backendOrder.orderStatus}.`,
          },
        ],
      }
    : null;

  const activeNotes = notesList || (order ? order.notes : []);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      author: 'Admin',
      time: 'Just now',
      text: newNoteText.trim(),
    };
    setNotesList([newNote, ...activeNotes]);
    setNewNoteText('');
    setIsAddingNote(false);
    triggerNotice('Internal note added to order record.');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderTimelineIcon = (type: string) => {
    switch (type) {
      case 'cart':
        return <ShoppingCart size={15} aria-hidden="true" />;
      case 'kitchen':
        return <ChefHat size={15} aria-hidden="true" />;
      case 'delivery':
        return <Bike size={15} aria-hidden="true" />;
      default:
        return <Check size={15} aria-hidden="true" />;
    }
  };

  // Safe Fallback for invalid/unknown order IDs
  if (loading) {
    return (
      <main className="admin-order-page admin-layout">
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          <button type="button" className="logo" onClick={() => onNavigate('/admin')}>
            <span className="logo-mark" aria-hidden="true">◒</span>
            <span>
              <strong>PizzaDelight</strong>
              <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
            </span>
          </button>
          <p className="admin-label">ADMIN PANEL</p>
          <button type="button" className="admin-nav" onClick={() => onNavigate('/admin')}>
            <Home size={17} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button type="button" className="admin-nav active" onClick={() => onNavigate('/admin/orders')}>
            <Package size={17} aria-hidden="true" />
            <span>Orders</span>
          </button>
          <button type="button" className="admin-nav" onClick={() => onNavigate('/admin/inventory')}>
            <Layers size={17} aria-hidden="true" />
            <span>Inventory</span>
          </button>
        </aside>
        <section className="admin-content" style={{ display: 'grid', placeItems: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <RefreshCw size={28} className="animate-spin text-red" style={{ margin: '0 auto 14px' }} />
            <p>Loading real order details from database...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!order || fetchError) {
    return (
      <main className="admin-order-page admin-layout">
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          <button type="button" className="logo" onClick={() => onNavigate('/admin')}>
            <span className="logo-mark" aria-hidden="true">◒</span>
            <span>
              <strong>PizzaDelight</strong>
              <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
            </span>
          </button>
          <p className="admin-label">ADMIN PANEL</p>
          <button type="button" className="admin-nav" onClick={() => onNavigate('/admin')}>
            <Home size={17} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button type="button" className="admin-nav active" onClick={() => onNavigate('/admin/orders')}>
            <Package size={17} aria-hidden="true" />
            <span>Orders</span>
          </button>
          <button type="button" className="admin-nav" onClick={() => onNavigate('/admin/inventory')}>
            <Layers size={17} aria-hidden="true" />
            <span>Inventory</span>
          </button>
          <div className="admin-spacer" />
          <button
            type="button"
            className="admin-nav"
            onClick={() => {
              logoutAdmin();
              onNavigate('/admin/login');
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </aside>

        <section className="admin-content">
          <div className="admin-order-not-found-card">
            <h2>Order Not Found</h2>
            <p>
              We couldn&apos;t find order #{orderId}. It may not exist in the active MongoDB database.
            </p>
            <button
              type="button"
              className="button button-outline"
              onClick={() => onNavigate('/admin/orders')}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Orders List</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-order-page admin-layout">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="admin-order-toast" role="status">
          <Info size={16} aria-hidden="true" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 1. Left Admin Sidebar */}
      <aside className="admin-sidebar" aria-label="Admin Navigation">
        <button
          type="button"
          className="logo admin-sidebar-logo"
          onClick={() => onNavigate('/admin')}
          aria-label="PizzaDelight home"
        >
          <span className="logo-mark" aria-hidden="true">◒</span>
          <span>
            <strong>PizzaDelight</strong>
            <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
          </span>
        </button>

        <p className="admin-label">ADMIN PANEL</p>

        <nav className="admin-nav-list" aria-label="Admin workspace tabs">
          <button
            type="button"
            className="admin-nav"
            onClick={() => onNavigate('/admin')}
          >
            <Home size={17} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className="admin-nav active"
            onClick={() => onNavigate('/admin/orders')}
          >
            <Package size={17} aria-hidden="true" />
            <span>Orders</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() => onNavigate('/admin/inventory')}
          >
            <Layers size={17} aria-hidden="true" />
            <span>Inventory</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Menu Management can be accessed through commissary catalog.')
            }
          >
            <BookOpen size={17} aria-hidden="true" />
            <span>Menu Management</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Customer records are linked with active customer orders.')
            }
          >
            <Users size={17} aria-hidden="true" />
            <span>Customers</span>
          </button>
        </nav>

        <div className="admin-sidebar-promo-card">
          <div className="promo-card-copy">
            <p className="promo-tagline">Fresh Food</p>
            <h4 className="promo-headline">
              Better Business <span className="text-red">♥</span>
            </h4>
          </div>
          <div className="promo-card-img-wrap" aria-hidden="true">
            <img
              src="https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=300&w=300"
              alt="Fresh pizza ingredients"
              loading="lazy"
            />
          </div>
        </div>

        <div className="admin-spacer" />

        {/* Logout CTA */}
        <button
          type="button"
          className="admin-nav admin-logout-btn"
          onClick={() => {
            logoutAdmin();
            onNavigate('/admin/login');
          }}
        >
          <LogOut size={17} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </aside>

      {/* 2. Main Order Details Workspace */}
      <section className="admin-content admin-order-content">
        {/* Top Admin Toolbar */}
        <header className="admin-topbar-strip" aria-label="Admin search and profile">
          <div className="admin-search-box">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search orders, customers, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search orders, customers, or IDs"
            />
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-topbar-bell-btn"
              onClick={() => triggerNotice('All systems operational.')}
              aria-label="View notifications"
            >
              <Bell size={18} />
              <span className="bell-badge-pill" aria-hidden="true">0</span>
            </button>

            <div className="admin-user-profile-btn" role="button" tabIndex={0}>
              <img
                src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=80&w=80"
                alt="Admin user avatar"
                className="admin-avatar-img"
              />
              <div className="admin-user-text">
                <strong>Admin</strong>
                <small>PizzaDelight Admin</small>
              </div>
              <ChevronDown size={15} className="admin-chevron-icon" aria-hidden="true" />
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <nav className="admin-breadcrumb-strip" aria-label="Breadcrumb">
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => onNavigate('/admin')}
          >
            <Home size={14} aria-hidden="true" />
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => onNavigate('/admin/orders')}
          >
            Orders
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current" aria-current="page">
            Order #{order.id}
          </span>
        </nav>

        {/* Order Header / Action Strip */}
        <div className="admin-order-header-row">
          <div className="admin-order-header-left">
            <div className="order-title-meta-line">
              <h1 className="admin-order-main-title">Order #{order.id}</h1>
              <span
                className={`admin-order-status-badge ${
                  order.status === 'Delivered'
                    ? 'status-delivered'
                    : order.status === 'In Kitchen'
                    ? 'status-in-kitchen'
                    : order.status === 'Out for Delivery'
                    ? 'status-out-delivery'
                    : 'status-received'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="admin-order-placed-note">
              Placed on {order.placedDate} &middot; Real MongoDB Record ({order.rawId})
            </p>
          </div>

          <div className="admin-order-header-actions">
            <button
              type="button"
              className="button button-outline admin-header-btn"
              onClick={handlePrint}
              aria-label="Print order receipt"
            >
              <Printer size={15} aria-hidden="true" />
              <span>Print Receipt</span>
            </button>

            {/* Advance Status Button */}
            <button
              type="button"
              className="button button-outline admin-header-btn"
              disabled={isUpdatingStatus || !nextStatus}
              onClick={async () => {
                if (backendOrder && nextStatus) {
                  setIsUpdatingStatus(true);
                  try {
                    const res = await updateOrderStatus(order.rawId, nextStatus);
                    if (res.success && res.data?.order) {
                      setBackendOrder(res.data.order);
                      setNextStatus(res.data.nextStatus);
                      triggerNotice(`Order status successfully updated to ${nextStatus.replace(/_/g, ' ')}!`);
                    } else {
                      triggerNotice(res.error || 'Failed to update order status.');
                    }
                  } catch {
                    triggerNotice('Network error occurred while updating status.');
                  } finally {
                    setIsUpdatingStatus(false);
                  }
                } else if (!nextStatus) {
                  triggerNotice('Order has reached final status (Sent to Delivery).');
                }
              }}
            >
              <RefreshCw size={15} aria-hidden="true" className={isUpdatingStatus ? 'animate-spin' : ''} />
              <span>{nextStatus ? `Advance to ${nextStatus.replace(/_/g, ' ')}` : 'Dispatched'}</span>
            </button>

            <div className="more-actions-container">
              <button
                type="button"
                className="button admin-more-actions-btn"
                onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                aria-expanded={moreActionsOpen}
                aria-haspopup="true"
              >
                <span>More Actions</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {moreActionsOpen && (
                <div className="admin-more-actions-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreActionsOpen(false);
                      onNavigate('/admin/orders');
                    }}
                  >
                    Back to All Orders
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreActionsOpen(false);
                      onNavigate('/admin/inventory');
                    }}
                  >
                    View Ingredients in Stock
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Stepper / Progress Timeline */}
        <div className="admin-timeline-panel" aria-label="Order Lifecycle Timeline">
          <div className="admin-timeline-track">
            {order.timeline.map((item, idx) => (
              <div
                key={idx}
                className={`admin-timeline-step ${item.completed ? 'step-completed' : 'step-pending'}`}
              >
                <div className="timeline-step-indicator" aria-hidden="true">
                  {renderTimelineIcon(item.icon)}
                </div>
                <div className="timeline-step-labels">
                  <strong className="timeline-step-name">{item.title}</strong>
                  <span className="timeline-step-timestamp">{item.time}</span>
                </div>
                {idx < order.timeline.length - 1 && (
                  <div
                    className={`timeline-connecting-bar ${
                      order.timeline[idx + 1].completed ? 'bar-filled' : 'bar-empty'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Main Layout: Left Details, Right Summary Cards */}
        <div className="admin-order-workspace-grid">
          {/* LEFT COLUMN: Items, Delivery, Notes */}
          <div className="admin-order-left-column">
            {/* Ordered Items Card */}
            <div className="admin-order-card items-card">
              <div className="card-header-bar">
                <h2>Items Ordered</h2>
                <span className="badge-item-count">{order.items.length} Item(s)</span>
              </div>

              <div className="admin-items-table-wrap">
                <table className="admin-items-table" aria-label="Ordered Pizza Items">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Customization</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td className="item-cell-product">
                          <img
                            src={it.image}
                            alt={it.name}
                            className="item-product-thumb"
                            loading="lazy"
                          />
                          <div>
                            <strong>{it.name}</strong>
                            <span className="item-variant-label">{it.variant}</span>
                          </div>
                        </td>
                        <td className="item-cell-customization">
                          <span className="custom-type-badge">{it.customizationType}</span>
                          <p className="custom-details-desc">{it.customizationDetails}</p>
                        </td>
                        <td className="item-cell-price">₹{it.price}</td>
                        <td className="item-cell-qty">{it.quantity}</td>
                        <td className="item-cell-total" style={{ textAlign: 'right' }}>
                          ₹{it.price * it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Totals Summary */}
              <div className="admin-order-totals-section">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <strong>₹{order.subtotal}</strong>
                </div>
                <div className="totals-row">
                  <span>Delivery Fee</span>
                  <strong className="text-green-600">FREE</strong>
                </div>
                <div className="totals-row">
                  <span>Taxes (5% GST)</span>
                  <strong>₹{order.taxes}</strong>
                </div>
                <hr className="totals-divider" />
                <div className="totals-row grand-total-row">
                  <span>Total Paid</span>
                  <strong className="grand-total-amount">₹{order.totalPaid}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Information Card */}
            <div className="admin-order-card delivery-info-card">
              <div className="card-header-bar">
                <h2>Delivery Information</h2>
                <span className="badge-partner-status">Express Dispatch</span>
              </div>

              <div className="delivery-card-body">
                <div className="delivery-address-group">
                  <div className="icon-circle address-icon">
                    <MapPin size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="section-subheading">Delivery Address</h3>
                    <p className="delivery-address-line">{order.delivery.addressLine1}</p>
                    <p className="delivery-address-line">{order.delivery.addressLine2}</p>
                    <p className="delivery-city-line">{order.delivery.city}</p>
                  </div>
                </div>

                <hr className="card-internal-divider" />

                <div className="delivery-partner-group">
                  <div className="partner-details-left">
                    <img
                      src={order.delivery.partnerAvatar}
                      alt={order.delivery.partnerName}
                      className="partner-avatar-img"
                    />
                    <div>
                      <h3 className="partner-name-text">{order.delivery.partnerName}</h3>
                      <p className="partner-role-note">Assigned Fleet Courier</p>
                      <span className="delivered-timestamp-badge">
                        Status: {order.delivery.deliveredAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Notes Card */}
            <div className="admin-order-card notes-card">
              <div className="card-header-bar">
                <h2>Order Activity &amp; Notes</h2>
                {!isAddingNote && (
                  <button
                    type="button"
                    className="button button-outline button-small"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Add Note</span>
                  </button>
                )}
              </div>

              {isAddingNote && (
                <div className="add-note-inline-box">
                  <textarea
                    rows={2}
                    className="note-textarea"
                    placeholder="Write an internal operational note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <div className="note-action-btns">
                    <button
                      type="button"
                      className="button button-small button-outline"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNoteText('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="button button-small"
                      onClick={handleAddNote}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              <div className="notes-list">
                {activeNotes.map((nt) => (
                  <div key={nt.id} className="note-entry-item">
                    <div className="note-meta-line">
                      <strong className="note-author">{nt.author}</strong>
                      <span className="note-time">{nt.time}</span>
                    </div>
                    <p className="note-content-text">{nt.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customer, Payment */}
          <div className="admin-order-right-column">
            {/* Customer Details Card */}
            <div className="admin-order-card customer-card">
              <div className="card-header-bar">
                <h2>Customer Details</h2>
                {order.customer.badge && (
                  <span className="badge-customer-vip">{order.customer.badge}</span>
                )}
              </div>

              <div className="customer-info-body">
                <div className="customer-avatar-row">
                  <div className="customer-large-avatar" aria-hidden="true">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="customer-display-name">{order.customer.name}</h3>
                    <p className="customer-member-since">Active PizzaDelight Customer</p>
                  </div>
                </div>

                <div className="customer-contact-list">
                  <div className="contact-item-row">
                    <Mail size={15} className="contact-icon" aria-hidden="true" />
                    <span>{order.customer.email}</span>
                  </div>
                  <div className="contact-item-row">
                    <Phone size={15} className="contact-icon" aria-hidden="true" />
                    <span>{order.customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            <div className="admin-order-card payment-card">
              <div className="card-header-bar">
                <h2>Payment Information</h2>
                <span
                  className={`badge-payment-status ${
                    order.payment.status === 'SUCCESS' ? 'badge-success' : 'badge-pending'
                  }`}
                >
                  {order.payment.status}
                </span>
              </div>

              <div className="payment-info-body">
                <div className="payment-method-row">
                  <CreditCard size={18} className="payment-method-icon" aria-hidden="true" />
                  <div>
                    <strong className="method-label">{order.payment.method}</strong>
                    <small className="txn-ref-code">Ref: {order.payment.referenceId}</small>
                  </div>
                </div>

                <div className="payment-breakdown-table">
                  <div className="payment-field-row">
                    <span>Transaction Total:</span>
                    <strong>₹{order.payment.amount}</strong>
                  </div>
                  <div className="payment-field-row">
                    <span>Verified At:</span>
                    <span>{order.payment.paidOn}</span>
                  </div>
                  <div className="payment-field-row">
                    <span>Gateway:</span>
                    <span>Razorpay Standard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
