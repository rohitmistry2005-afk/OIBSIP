import { useState, useEffect } from 'react';
import { getAdminOrder, updateOrderStatus } from './services/adminApi';
import { BackendOrder } from './services/orderApi';
import {
  ArrowLeft,
  Award,
  Bell,
  Bike,
  BookOpen,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  CreditCard,
  Edit2,
  FileText,
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
  Settings,
  ShoppingCart,
  TrendingUp,
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

// Known orders dataset based on existing Admin and App mock order data
const ADMIN_ORDERS: Record<string, AdminOrderData> = {
  'PD-2048': {
    id: 'PD-2048',
    placedDate: 'Sep 12, 2026 at 7:24 PM',
    status: 'Delivered',
    timeline: [
      { step: '1', title: 'Order Placed', time: 'Sep 12, 7:24 PM', completed: true, icon: 'cart' },
      { step: '2', title: 'Confirmed', time: 'Sep 12, 7:25 PM', completed: true, icon: 'confirm' },
      { step: '3', title: 'In the Kitchen', time: 'Sep 12, 7:28 PM', completed: true, icon: 'kitchen' },
      { step: '4', title: 'Out for Delivery', time: 'Sep 12, 7:52 PM', completed: true, icon: 'delivery' },
      { step: '5', title: 'Delivered', time: 'Sep 12, 8:15 PM', completed: true, icon: 'delivered' },
    ],
    items: [
      {
        id: 'item-1',
        name: 'Margherita',
        variant: '10" Regular',
        customizationType: 'Classic',
        customizationDetails: 'Tomato sauce, mozzarella, fresh basil, herbs',
        price: 299,
        quantity: 1,
        image: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
      {
        id: 'item-2',
        name: 'Garlic Bread',
        variant: '4 Pieces',
        customizationType: 'Standard',
        customizationDetails: 'Freshly baked with garlic butter and herbs',
        price: 149,
        quantity: 1,
        image: 'https://images.pexels.com/photos/208537/pexels-photo-208537.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
      {
        id: 'item-3',
        name: 'Pepsi',
        variant: '500ml',
        customizationType: 'Standard',
        customizationDetails: 'Chilled beverage',
        price: 60,
        quantity: 1,
        image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
    ],
    subtotal: 508,
    deliveryFee: 40,
    taxes: 22,
    totalPaid: 570,
    customer: {
      name: 'Rohit Mistry',
      email: 'rohit.mistry@example.com',
      phone: '+91 98765 43210',
      badge: 'VIP',
      memberSince: 'Aug 2026',
      totalOrders: 12,
    },
    delivery: {
      addressLine1: '123, Green Park Apartments',
      addressLine2: 'Sector 7, Salt Lake',
      city: 'Kolkata, West Bengal 700091',
      deliveredAt: 'Sep 12, 2026, 8:15 PM',
      partnerName: 'Amit Kumar',
      partnerPhone: '+91 91234 56789',
      partnerAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    payment: {
      method: 'Razorpay (UPI)',
      status: 'Success',
      amount: 570,
      referenceId: 'Demo Reference (pay_PD2048_demo)',
      paidOn: 'Sep 12, 2026, 7:24 PM',
    },
    notes: [
      {
        id: 'note-1',
        author: 'Admin',
        time: 'Sep 12, 2026, 8:20 PM',
        text: 'Order delivered successfully. Customer was satisfied with the food quality.',
      },
    ],
  },
  'PD-2047': {
    id: 'PD-2047',
    placedDate: 'Sep 16, 2026 at 1:10 PM',
    status: 'Received',
    timeline: [
      { step: '1', title: 'Order Placed', time: 'Sep 16, 1:10 PM', completed: true, icon: 'cart' },
      { step: '2', title: 'Confirmed', time: 'Sep 16, 1:12 PM', completed: true, icon: 'confirm' },
      { step: '3', title: 'In the Kitchen', time: 'Pending', completed: false, icon: 'kitchen' },
      { step: '4', title: 'Out for Delivery', time: 'Pending', completed: false, icon: 'delivery' },
      { step: '5', title: 'Delivered', time: 'Pending', completed: false, icon: 'delivered' },
    ],
    items: [
      {
        id: 'item-2047-1',
        name: 'Cheese Burst',
        variant: '10" Regular',
        customizationType: 'Extra Cheese',
        customizationDetails: 'Extra cheese, signature tomato sauce',
        price: 449,
        quantity: 1,
        image: 'https://images.pexels.com/photos/34407073/pexels-photo-34407073.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
    ],
    subtotal: 449,
    deliveryFee: 0,
    taxes: 22,
    totalPaid: 471,
    customer: {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      phone: '+91 98301 22334',
      memberSince: 'Jul 2026',
      totalOrders: 5,
    },
    delivery: {
      addressLine1: '45, Lake View Road',
      addressLine2: 'Ballygunge',
      city: 'Kolkata, West Bengal 700019',
      deliveredAt: 'Estimated in 35 mins',
      partnerName: 'Rajesh Sen',
      partnerPhone: '+91 98765 11223',
      partnerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    payment: {
      method: 'Razorpay (Card)',
      status: 'Success',
      amount: 471,
      referenceId: 'Demo Reference (pay_PD2047_demo)',
      paidOn: 'Sep 16, 2026, 1:10 PM',
    },
    notes: [
      {
        id: 'note-2047-1',
        author: 'Admin',
        time: 'Sep 16, 2026, 1:12 PM',
        text: 'Order verified and queued for kitchen prep.',
      },
    ],
  },
  'PD-2046': {
    id: 'PD-2046',
    placedDate: 'Sep 16, 2026 at 12:45 PM',
    status: 'Out for Delivery',
    timeline: [
      { step: '1', title: 'Order Placed', time: 'Sep 16, 12:45 PM', completed: true, icon: 'cart' },
      { step: '2', title: 'Confirmed', time: 'Sep 16, 12:47 PM', completed: true, icon: 'confirm' },
      { step: '3', title: 'In the Kitchen', time: 'Sep 16, 1:00 PM', completed: true, icon: 'kitchen' },
      { step: '4', title: 'Out for Delivery', time: 'Sep 16, 1:20 PM', completed: true, icon: 'delivery' },
      { step: '5', title: 'Delivered', time: 'Pending', completed: false, icon: 'delivered' },
    ],
    items: [
      {
        id: 'item-2046-1',
        name: 'Chicken Feast',
        variant: '12" Large',
        customizationType: 'Non-Veg Special',
        customizationDetails: 'Grilled chicken, onions, capsicum, mozzarella',
        price: 399,
        quantity: 2,
        image: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
      {
        id: 'item-2046-2',
        name: 'Farmhouse',
        variant: '10" Regular',
        customizationType: 'Veggie',
        customizationDetails: 'Onions, capsicum, mushrooms, olives',
        price: 349,
        quantity: 1,
        image: 'https://images.pexels.com/photos/5640034/pexels-photo-5640034.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
    ],
    subtotal: 1147,
    deliveryFee: 0,
    taxes: 57,
    totalPaid: 1204,
    customer: {
      name: 'Neha Kapoor',
      email: 'neha.kapoor@example.com',
      phone: '+91 98111 55667',
      badge: 'VIP',
      memberSince: 'May 2026',
      totalOrders: 18,
    },
    delivery: {
      addressLine1: '88, Park Street',
      addressLine2: 'Block A, Flat 4B',
      city: 'Kolkata, West Bengal 700016',
      deliveredAt: 'Driver en route',
      partnerName: 'Bikash Roy',
      partnerPhone: '+91 98312 99887',
      partnerAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    payment: {
      method: 'Razorpay (Net Banking)',
      status: 'Success',
      amount: 1204,
      referenceId: 'Demo Reference (pay_PD2046_demo)',
      paidOn: 'Sep 16, 2026, 12:45 PM',
    },
    notes: [
      {
        id: 'note-2046-1',
        author: 'Admin',
        time: 'Sep 16, 2026, 1:21 PM',
        text: 'Dispatched with rider Bikash Roy. Customer requested contactless handoff.',
      },
    ],
  },
};

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

  useEffect(() => {
    let isMounted = true;
    getAdminOrder(orderId)
      .then((res) => {
        if (isMounted && res.success && res.data?.order) {
          setBackendOrder(res.data.order);
          setNextStatus(res.data.nextStatus);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const cleanId = orderId.replace(/^#/, '').toUpperCase();
  const mockOrder =
    ADMIN_ORDERS[cleanId] ||
    (cleanId === 'PD-2048' ? ADMIN_ORDERS['PD-2048'] : undefined);

  const order: AdminOrderData | undefined = backendOrder
    ? {
        id: String(backendOrder.id || backendOrder._id).slice(-8).toUpperCase(),
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
            title: 'Order Placed',
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
            title: 'Sent to Delivery',
            time: backendOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'Dispatched' : 'Pending',
            completed: backendOrder.orderStatus === 'SENT_TO_DELIVERY',
            icon: 'delivery',
          },
        ],
        items: [
          {
            id: String(backendOrder.id || backendOrder._id),
            name: backendOrder.pizza?.name || 'Custom Pizza',
            variant: `${backendOrder.customization?.base?.name || 'Classic'} Crust`,
            customizationType: backendOrder.customization?.cheese?.name || 'Mozzarella',
            customizationDetails: `Sauce: ${backendOrder.customization?.sauce?.name || 'Tomato'}${
              backendOrder.customization?.vegetables?.length
                ? ` · Veggies: ${backendOrder.customization.vegetables.map((v) => v.name).join(', ')}`
                : ''
            }`,
            price: Math.round((backendOrder.totalAmount - Math.round((backendOrder.totalAmount * 5) / 105)) / (backendOrder.quantity || 1)),
            quantity: backendOrder.quantity,
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
          name: typeof backendOrder.user === 'object' && backendOrder.user?.name ? backendOrder.user.name : 'Customer',
          email: typeof backendOrder.user === 'object' && backendOrder.user?.email ? backendOrder.user.email : 'user@example.com',
          phone: '+91 98765 43210',
          badge: 'Verified',
          memberSince: '2026',
          totalOrders: 1,
        },
        delivery: {
          addressLine1: 'Customer delivery address',
          addressLine2: 'Express dispatch',
          city: 'Delivery Area',
          deliveredAt: backendOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'En Route' : 'Kitchen Prep',
          partnerName: 'Fleet Rider',
          partnerPhone: '+91 91234 56789',
          partnerAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
        },
        payment: {
          method: backendOrder.paymentStatus === 'SUCCESS' ? 'Razorpay' : 'Pending',
          status: backendOrder.paymentStatus,
          amount: backendOrder.totalAmount,
          referenceId: backendOrder.razorpayPaymentId || backendOrder.razorpayOrderId || 'N/A',
          paidOn: new Date(backendOrder.createdAt).toLocaleString(),
        },
        notes: [
          {
            id: 'note-1',
            author: 'System',
            time: 'At order creation',
            text: `Order received with payment status: ${backendOrder.paymentStatus}.`,
          },
        ],
      }
    : mockOrder;

  const activeNotes = notesList || (order ? order.notes : []);

  const triggerNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3800);
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      author: 'Admin',
      time: 'Just now',
      text: newNoteText.trim(),
    };
    setNotesList([...activeNotes, newNote]);
    setNewNoteText('');
    setIsAddingNote(false);
    triggerNotice('Note added locally to this session (backend sync unavailable).');
  };

  // Safe Fallback for invalid/unknown order IDs
  if (!order) {
    return (
      <main className="admin-order-page admin-layout">
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          <button
            type="button"
            className="logo"
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
            onClick={() => onNavigate('/admin')}
          >
            <Package size={17} aria-hidden="true" />
            <span>Orders</span>
          </button>
          <div className="admin-spacer" />
          <button
            type="button"
            className="admin-nav"
            onClick={() => onNavigate('/')}
          >
            <LogOut size={17} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </aside>

        <section className="admin-content">
          <div className="admin-order-not-found-card">
            <h2>Order Not Found</h2>
            <p>
              We couldn&apos;t find admin order #{orderId}. It may not exist in the
              mock operational database.
            </p>
            <button
              type="button"
              className="button button-outline"
              onClick={() => onNavigate('/admin')}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Orders</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  const renderTimelineIcon = (type: string) => {
    switch (type) {
      case 'cart':
        return <ShoppingCart size={15} aria-hidden="true" />;
      case 'confirm':
        return <FileText size={15} aria-hidden="true" />;
      case 'kitchen':
        return <ChefHat size={15} aria-hidden="true" />;
      case 'delivery':
        return <Bike size={15} aria-hidden="true" />;
      case 'delivered':
      default:
        return <Check size={15} aria-hidden="true" />;
    }
  };

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
            onClick={() => onNavigate('/admin')}
          >
            <Package size={17} aria-hidden="true" />
            <span>Orders</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Menu Management is not connected in this preview.')
            }
          >
            <BookOpen size={17} aria-hidden="true" />
            <span>Menu Management</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() => onNavigate('/admin')}
          >
            <Layers size={17} aria-hidden="true" />
            <span>Inventory</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Customer database is not connected in this preview.')
            }
          >
            <Users size={17} aria-hidden="true" />
            <span>Customers</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Offers and coupons service is unconfigured.')
            }
          >
            <Award size={17} aria-hidden="true" />
            <span>Offers &amp; Coupons</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Analytics & reporting module is in preview mode.')
            }
          >
            <TrendingUp size={17} aria-hidden="true" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('System notifications require active WebSocket server.')
            }
          >
            <Bell size={17} aria-hidden="true" />
            <span>Notifications</span>
          </button>
          <button
            type="button"
            className="admin-nav"
            onClick={() =>
              triggerNotice('Admin settings are unavailable in this preview.')
            }
          >
            <Settings size={17} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Promotional Card */}
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
          onClick={() => onNavigate('/')}
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
              onClick={() => triggerNotice('3 unread alerts (real-time notification service unconfigured).')}
              aria-label="View notifications (3 unread)"
            >
              <Bell size={18} />
              <span className="bell-badge-pill" aria-hidden="true">3</span>
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
            onClick={() => onNavigate('/admin')}
          >
            Orders
          </button>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current" aria-current="page">
            Order #{order.id}
          </span>
        </nav>

        {/* Order Header Row */}
        <div className="admin-order-header-row">
          <div className="order-title-group">
            <div className="order-title-line">
              <h1 className="admin-order-main-title">Order #{order.id}</h1>
              <span className={`admin-order-status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {order.status}
              </span>
            </div>
            <p className="admin-order-placed-subtitle">
              Placed on {order.placedDate}
            </p>
          </div>

          <div className="admin-order-header-actions">
            <button
              type="button"
              className="button button-outline admin-header-btn"
              onClick={() =>
                triggerNotice('Invoice generation service is currently unavailable in this preview.')
              }
            >
              <Printer size={15} aria-hidden="true" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              className="button button-outline admin-header-btn"
              onClick={() =>
                triggerNotice('Email dispatch service is not configured. Connect SMTP backend to send emails.')
              }
            >
              <Mail size={15} aria-hidden="true" />
              <span>Send Email</span>
            </button>

            <button
              type="button"
              className="button button-outline admin-header-btn"
              disabled={isUpdatingStatus}
              onClick={async () => {
                if (backendOrder && nextStatus) {
                  setIsUpdatingStatus(true);
                  try {
                    const res = await updateOrderStatus(orderId, nextStatus);
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
                } else if (backendOrder && !nextStatus) {
                  triggerNotice('Order has reached the final stage (Sent to Delivery).');
                } else {
                  triggerNotice('Status updated locally for demo.');
                }
              }}
            >
              <RefreshCw size={15} aria-hidden="true" className={isUpdatingStatus ? 'animate-spin' : ''} />
              <span>{nextStatus ? `Advance to ${nextStatus.replace(/_/g, ' ')}` : 'Update Status'}</span>
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
                <ChevronDown size={15} aria-hidden="true" />
              </button>

              {moreActionsOpen && (
                <div className="more-actions-dropdown-menu" role="menu">
                  <button
                    type="button"
                    className="dropdown-action-item"
                    role="menuitem"
                    onClick={() => {
                      setMoreActionsOpen(false);
                      triggerNotice('Exporting order summary as PDF is unavailable.');
                    }}
                  >
                    <FileText size={14} aria-hidden="true" />
                    <span>Download Summary</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-action-item"
                    role="menuitem"
                    onClick={() => {
                      setMoreActionsOpen(false);
                      triggerNotice('Order flagging is unavailable in preview (no backend persistence).');
                    }}
                  >
                    <Info size={14} aria-hidden="true" />
                    <span>Flag for Review</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal 5-Step Order Status Timeline Card */}
        <div className="admin-card admin-timeline-card">
          <div className="admin-timeline-track">
            {order.timeline.map((step, idx) => (
              <div
                className={`admin-timeline-step ${step.completed ? 'completed' : 'pending'}`}
                key={step.title}
              >
                <div className="timeline-step-indicator">
                  <span className="step-circle-icon">
                    {renderTimelineIcon(step.icon)}
                  </span>
                  {idx < order.timeline.length - 1 && (
                    <span
                      className={`timeline-connecting-bar ${
                        step.completed ? 'completed' : ''
                      }`}
                    />
                  )}
                </div>
                <div className="timeline-step-labels">
                  <strong className="timeline-step-title">{step.title}</strong>
                  <small className="timeline-step-time">{step.time}</small>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Success / Status Banner */}
          {order.status === 'Delivered' ? (
            <div className="admin-delivery-success-banner">
              <div className="success-banner-icon" aria-hidden="true">
                <Check size={18} />
              </div>
              <div className="success-banner-copy">
                <strong>This order has been delivered successfully!</strong>
                <p>Customer has received the order and marked it as delivered.</p>
              </div>
            </div>
          ) : (
            <div className="admin-delivery-active-banner">
              <div className="active-banner-icon" aria-hidden="true">
                <Clock size={18} />
              </div>
              <div className="active-banner-copy">
                <strong>Order status: {order.status}</strong>
                <p>Kitchen and logistics operations are processing this ticket.</p>
              </div>
            </div>
          )}
        </div>

        {/* Main 2-Column Split Layout */}
        <div className="admin-order-split-layout">
          {/* Left / Center Column: Order Items Table & Totals */}
          <div className="admin-order-left-column">
            <div className="admin-card admin-items-card">
              <h2 className="admin-card-section-title">Order Items</h2>

              <div className="admin-table-responsive-wrapper">
                <table className="admin-order-items-table">
                  <thead>
                    <tr>
                      <th scope="col" className="col-item">Item</th>
                      <th scope="col" className="col-custom">Customizations</th>
                      <th scope="col" className="col-price">Price</th>
                      <th scope="col" className="col-qty">Qty</th>
                      <th scope="col" className="col-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="col-item">
                          <div className="table-item-cell">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="item-row-thumbnail"
                              loading="lazy"
                            />
                            <div className="item-row-names">
                              <strong className="item-row-title">{item.name} ({item.variant})</strong>
                            </div>
                          </div>
                        </td>
                        <td className="col-custom">
                          <div className="item-customization-box">
                            <strong className="customization-type">{item.customizationType}</strong>
                            <p className="customization-details">{item.customizationDetails}</p>
                          </div>
                        </td>
                        <td className="col-price">
                          <span className="item-unit-price">₹{item.price}</span>
                        </td>
                        <td className="col-qty">
                          <span className="item-quantity-text">{item.quantity}</span>
                        </td>
                        <td className="col-total">
                          <strong className="item-line-total">₹{item.price * item.quantity}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Breakdown */}
              <div className="admin-order-totals-section">
                <div className="totals-line-row">
                  <span className="totals-line-label">Subtotal</span>
                  <span className="totals-line-val">₹{order.subtotal}</span>
                </div>
                <div className="totals-line-row">
                  <span className="totals-line-label">Delivery Fee</span>
                  <span className="totals-line-val">₹{order.deliveryFee}</span>
                </div>
                <div className="totals-line-row">
                  <span className="totals-line-label">Taxes (GST)</span>
                  <span className="totals-line-val">₹{order.taxes}</span>
                </div>
                <div className="totals-final-row">
                  <span className="final-total-label">Total Paid</span>
                  <strong className="final-total-val">₹{order.totalPaid}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer, Delivery, Payment, Notes */}
          <div className="admin-order-right-column">
            {/* Card 1: Customer Information */}
            <div className="admin-card admin-customer-card">
              <div className="card-header-line">
                <h3 className="admin-card-title">Customer Information</h3>
                <button
                  type="button"
                  className="card-header-edit-btn"
                  onClick={() =>
                    triggerNotice('Customer profile editing is unavailable in this preview.')
                  }
                  aria-label="Edit customer information"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="customer-info-body">
                <div className="customer-avatar-row">
                  <div className="customer-avatar-circle" aria-hidden="true">
                    <User size={22} />
                  </div>
                  <div className="customer-name-block">
                    <div className="name-and-badge">
                      <strong className="customer-name">{order.customer.name}</strong>
                      {order.customer.badge && (
                        <span className="customer-vip-badge">{order.customer.badge}</span>
                      )}
                    </div>
                    <p className="customer-email">{order.customer.email}</p>
                    <p className="customer-phone">
                      <Phone size={13} aria-hidden="true" />
                      <span>{order.customer.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="customer-meta-strip">
                  <span>Customer since {order.customer.memberSince}</span>
                  <span className="meta-sep">|</span>
                  <span>{order.customer.totalOrders} Orders</span>
                </div>
              </div>
            </div>

            {/* Card 2: Delivery Information */}
            <div className="admin-card admin-delivery-card">
              <div className="card-header-line">
                <h3 className="admin-card-title">Delivery Information</h3>
                <button
                  type="button"
                  className="card-header-edit-btn"
                  onClick={() =>
                    triggerNotice('Delivery destination editing requires dispatcher integration.')
                  }
                  aria-label="Edit delivery information"
                >
                  <Edit2 size={13} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="delivery-info-body">
                <div className="delivery-address-group">
                  <div className="address-icon-wrap" aria-hidden="true">
                    <MapPin size={18} />
                  </div>
                  <div className="address-copy">
                    <p className="address-line">{order.delivery.addressLine1}</p>
                    <p className="address-line">{order.delivery.addressLine2}</p>
                    <p className="address-line">{order.delivery.city}</p>
                  </div>
                  <button
                    type="button"
                    className="button button-outline map-view-btn"
                    onClick={() =>
                      triggerNotice('Live map coordinates are unavailable in this preview.')
                    }
                  >
                    View on Map
                  </button>
                </div>

                <div className="delivery-partner-subcard">
                  <p className="partner-section-label">Delivery Partner</p>
                  <div className="partner-details-strip">
                    <img
                      src={order.delivery.partnerAvatar}
                      alt={order.delivery.partnerName}
                      className="partner-avatar-img"
                    />
                    <div className="partner-name-col">
                      <strong className="partner-name">{order.delivery.partnerName}</strong>
                      <p className="partner-phone">{order.delivery.partnerPhone}</p>
                    </div>
                    <button
                      type="button"
                      className="button button-outline partner-call-btn"
                      onClick={() =>
                        triggerNotice('Driver calling is unavailable in this preview.')
                      }
                    >
                      <Phone size={13} aria-hidden="true" />
                      <span>Call</span>
                    </button>
                  </div>

                  <div className="delivered-time-strip">
                    <span className="time-strip-label">Delivered at</span>
                    <div className="time-strip-val">
                      <Clock size={14} aria-hidden="true" />
                      <span>{order.delivery.deliveredAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Payment Information */}
            <div className="admin-card admin-payment-card">
              <div className="card-header-line">
                <h3 className="admin-card-title">Payment Information</h3>
                <span className="payment-status-pill paid">Paid</span>
              </div>

              <div className="payment-info-body">
                <div className="payment-method-row">
                  <div className="payment-provider-icon" aria-hidden="true">
                    <CreditCard size={18} />
                  </div>
                  <strong className="payment-provider-name">{order.payment.method}</strong>
                  <strong className="payment-provider-amount">₹{order.payment.amount}</strong>
                </div>

                <div className="payment-details-grid">
                  <div className="payment-meta-field">
                    <span className="meta-field-label">Transaction ID</span>
                    <strong className="meta-field-val reference-id">{order.payment.referenceId}</strong>
                    <small className="payment-demo-subtext">Demo reference &bull; Not a live gateway record</small>
                  </div>

                  <div className="payment-meta-field">
                    <span className="meta-field-label">Payment Status</span>
                    <span className="meta-field-status success">{order.payment.status}</span>
                  </div>

                  <div className="payment-meta-field full-width">
                    <span className="meta-field-label">Paid on</span>
                    <span className="meta-field-val">{order.payment.paidOn}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Order Notes */}
            <div className="admin-card admin-notes-card">
              <div className="card-header-line">
                <h3 className="admin-card-title">Order Notes</h3>
                <button
                  type="button"
                  className="card-header-add-btn"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>Add Note</span>
                </button>
              </div>

              {isAddingNote && (
                <div className="admin-note-input-wrap">
                  <textarea
                    className="admin-note-textarea"
                    placeholder="Enter operational note (stored in local UI session only)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    rows={2}
                  />
                  <div className="admin-note-actions">
                    <button
                      type="button"
                      className="button button-outline button-small"
                      onClick={() => setIsAddingNote(false)}
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

              <div className="order-notes-list">
                {activeNotes.map((n) => (
                  <div className="order-note-item" key={n.id}>
                    <div className="note-author-avatar" aria-hidden="true">
                      <span>{n.author.charAt(0)}</span>
                    </div>
                    <div className="note-content-wrap">
                      <div className="note-header-line">
                        <strong className="note-author-name">{n.author} Note</strong>
                        <span className="note-timestamp">{n.time}</span>
                      </div>
                      <p className="note-text-body">{n.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
