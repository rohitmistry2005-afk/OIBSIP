import { useState, useEffect } from 'react';
import type { Product } from './PizzaDetails';
import { getMyOrder, BackendOrder } from './services/orderApi';
import {
  Heart,
  MapPin,
  ChevronRight,
  RotateCcw,
  MoreHorizontal,
  Check,
  Bike,
  Phone,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  Headphones,
  Plus,
  ArrowRight,
  Info,
  Clock,
  CreditCard,
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  variant: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  productId?: string;
}

interface OrderData {
  id: string;
  placedDate: string;
  status: 'Delivered' | 'In Kitchen' | 'Out for Delivery' | 'Received';
  timeline: {
    title: string;
    time: string;
    completed: boolean;
    current?: boolean;
  }[];
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  totalPaid: number;
  paymentMethod: string;
  txnRef: string;
  paymentTime: string;
  deliveryPartner: {
    name: string;
    role: string;
    rating: string;
    deliveries: string;
    avatar: string;
  };
  deliveryAddress: {
    tag: string;
    line1: string;
    line2: string;
    city: string;
  };
}

// Known orders dataset based on existing application orders
const KNOWN_ORDERS: Record<string, OrderData> = {
  'PD-2048': {
    id: 'PD-2048',
    placedDate: 'Sep 12, 2026 at 7:24 PM',
    status: 'Delivered',
    timeline: [
      { title: 'Order Placed', time: 'Sep 12, 7:24 PM', completed: true },
      { title: 'In the Kitchen', time: 'Sep 12, 7:28 PM', completed: true },
      { title: 'Out for Delivery', time: 'Sep 12, 7:52 PM', completed: true },
      { title: 'Delivered', time: 'Sep 12, 8:15 PM', completed: true, current: true },
    ],
    items: [
      {
        id: 'item-1',
        name: 'Margherita',
        variant: '10" Regular | Classic',
        description: 'Tomato sauce, mozzarella, fresh basil, herbs',
        price: 299,
        quantity: 1,
        image: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'margherita',
      },
      {
        id: 'item-2',
        name: 'Garlic Bread',
        variant: '4 Pieces | Classic',
        description: 'Freshly baked with garlic butter and herbs',
        price: 149,
        quantity: 1,
        image: 'https://images.pexels.com/photos/208537/pexels-photo-208537.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
      {
        id: 'item-3',
        name: 'Pepsi',
        variant: '500ml',
        description: 'Chilled beverage',
        price: 60,
        quantity: 1,
        image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      },
    ],
    subtotal: 508,
    deliveryFee: 40,
    taxes: 22,
    totalPaid: 570,
    paymentMethod: 'Paid via Razorpay (UPI)',
    txnRef: 'pay_PD2048_9f3a7d2e',
    paymentTime: 'Sep 12, 2026, 7:24 PM',
    deliveryPartner: {
      name: 'Amit Kumar',
      role: 'Delivery Partner',
      rating: '4.8',
      deliveries: '320+ deliveries',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    deliveryAddress: {
      tag: 'Home',
      line1: '123, Green Park Apartments',
      line2: 'Sector 7, Salt Lake',
      city: 'Kolkata, West Bengal 700091',
    },
  },
  'PD-1932': {
    id: 'PD-1932',
    placedDate: 'Aug 18, 2026 at 1:15 PM',
    status: 'Delivered',
    timeline: [
      { title: 'Order Placed', time: 'Aug 18, 1:15 PM', completed: true },
      { title: 'In the Kitchen', time: 'Aug 18, 1:20 PM', completed: true },
      { title: 'Out for Delivery', time: 'Aug 18, 1:35 PM', completed: true },
      { title: 'Delivered', time: 'Aug 18, 1:52 PM', completed: true, current: true },
    ],
    items: [
      {
        id: 'item-1932-1',
        name: 'Farmhouse',
        variant: '10" Regular | Classic',
        description: 'Onions, capsicum, mushrooms, tomatoes and olives.',
        price: 349,
        quantity: 1,
        image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'farmhouse',
      },
    ],
    subtotal: 349,
    deliveryFee: 40,
    taxes: 17,
    totalPaid: 406,
    paymentMethod: 'Paid via Card',
    txnRef: 'pay_PD1932_8b2c1a4f',
    paymentTime: 'Aug 18, 2026, 1:15 PM',
    deliveryPartner: {
      name: 'Rajesh Sen',
      role: 'Delivery Partner',
      rating: '4.9',
      deliveries: '480+ deliveries',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    deliveryAddress: {
      tag: 'Home',
      line1: '24, Olive Street, 3rd Floor',
      line2: 'Salt Lake Sector 1',
      city: 'Kolkata, West Bengal 700064',
    },
  },
  'PD-1877': {
    id: 'PD-1877',
    placedDate: 'Sep 02, 2026 at 8:40 PM',
    status: 'Delivered',
    timeline: [
      { title: 'Order Placed', time: 'Sep 02, 8:40 PM', completed: true },
      { title: 'In the Kitchen', time: 'Sep 02, 8:45 PM', completed: true },
      { title: 'Out for Delivery', time: 'Sep 02, 9:02 PM', completed: true },
      { title: 'Delivered', time: 'Sep 02, 9:20 PM', completed: true, current: true },
    ],
    items: [
      {
        id: 'item-1877-1',
        name: 'Margherita',
        variant: '12" Large | Classic',
        description: 'Classic delight with fresh tomatoes, mozzarella and basil.',
        price: 299,
        quantity: 2,
        image: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'margherita',
      },
    ],
    subtotal: 598,
    deliveryFee: 0,
    taxes: 30,
    totalPaid: 628,
    paymentMethod: 'Paid via UPI',
    txnRef: 'pay_PD1877_3c8e9d10',
    paymentTime: 'Sep 02, 2026, 8:40 PM',
    deliveryPartner: {
      name: 'Bikash Roy',
      role: 'Delivery Partner',
      rating: '4.7',
      deliveries: '210+ deliveries',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    deliveryAddress: {
      tag: 'Home',
      line1: '123, Green Park Apartments',
      line2: 'Sector 7, Salt Lake',
      city: 'Kolkata, West Bengal 700091',
    },
  },
  'PD-2017': {
    id: 'PD-2017',
    placedDate: 'Sep 12, 2026 at 6:10 PM',
    status: 'Delivered',
    timeline: [
      { title: 'Order Placed', time: 'Sep 12, 6:10 PM', completed: true },
      { title: 'In the Kitchen', time: 'Sep 12, 6:15 PM', completed: true },
      { title: 'Out for Delivery', time: 'Sep 12, 6:35 PM', completed: true },
      { title: 'Delivered', time: 'Sep 12, 6:55 PM', completed: true, current: true },
    ],
    items: [
      {
        id: 'item-2017-1',
        name: 'Farmhouse',
        variant: '10" Regular | Classic',
        description: 'Onions, capsicum, mushrooms, tomatoes and olives.',
        price: 349,
        quantity: 1,
        image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'farmhouse',
      },
      {
        id: 'item-2017-2',
        name: 'Margherita',
        variant: '10" Regular | Classic',
        description: 'Fresh tomatoes, mozzarella and basil.',
        price: 299,
        quantity: 1,
        image: 'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'margherita',
      },
    ],
    subtotal: 648,
    deliveryFee: 0,
    taxes: 32,
    totalPaid: 680,
    paymentMethod: 'Paid via Razorpay (UPI)',
    txnRef: 'pay_PD2017_4a1f7e9b',
    paymentTime: 'Sep 12, 2026, 6:10 PM',
    deliveryPartner: {
      name: 'Amit Kumar',
      role: 'Delivery Partner',
      rating: '4.8',
      deliveries: '320+ deliveries',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    deliveryAddress: {
      tag: 'Office',
      line1: 'Tech Park Block B, Plot 14',
      line2: 'New Town',
      city: 'Kolkata, West Bengal 700156',
    },
  },
  'PD-1983': {
    id: 'PD-1983',
    placedDate: 'Sep 08, 2026 at 2:05 PM',
    status: 'Delivered',
    timeline: [
      { title: 'Order Placed', time: 'Sep 08, 2:05 PM', completed: true },
      { title: 'In the Kitchen', time: 'Sep 08, 2:10 PM', completed: true },
      { title: 'Out for Delivery', time: 'Sep 08, 2:28 PM', completed: true },
      { title: 'Delivered', time: 'Sep 08, 2:48 PM', completed: true, current: true },
    ],
    items: [
      {
        id: 'item-1983-1',
        name: 'Cheese Burst',
        variant: '10" Regular | Extra Cheese',
        description: 'Extra cheese. Extra happiness.',
        price: 449,
        quantity: 1,
        image: 'https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        productId: 'cheese',
      },
    ],
    subtotal: 449,
    deliveryFee: 40,
    taxes: 22,
    totalPaid: 511,
    paymentMethod: 'Paid via Card',
    txnRef: 'pay_PD1983_9e4c2b1d',
    paymentTime: 'Sep 08, 2026, 2:05 PM',
    deliveryPartner: {
      name: 'Rajesh Sen',
      role: 'Delivery Partner',
      rating: '4.9',
      deliveries: '480+ deliveries',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
    },
    deliveryAddress: {
      tag: 'Home',
      line1: '123, Green Park Apartments',
      line2: 'Sector 7, Salt Lake',
      city: 'Kolkata, West Bengal 700091',
    },
  },
};

interface OrderDetailsProps {
  orderId: string;
  onNavigate: (path: string) => void;
  onAdd: (product: Product) => void;
  allProducts: Product[];
}

export function OrderDetails({
  orderId,
  onNavigate,
  onAdd,
  allProducts,
}: OrderDetailsProps) {
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [backendOrder, setBackendOrder] = useState<BackendOrder | null>(null);
  const [, setLoading] = useState(true);

  // Poll real backend order every 4 seconds while active
  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      try {
        const res = await getMyOrder(orderId);
        if (isMounted && res.success && res.data?.order) {
          setBackendOrder(res.data.order);
        }
      } catch {
        // Fall back gracefully to mock if offline
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrder();

    const interval = setInterval(() => {
      getMyOrder(orderId)
        .then((res) => {
          if (isMounted && res.success && res.data?.order) {
            setBackendOrder(res.data.order);
            if (res.data.order.orderStatus === 'SENT_TO_DELIVERY') {
              clearInterval(interval);
            }
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  // Normalize order ID (handle case or leading hash)
  const cleanId = orderId.replace(/^#/, '').toUpperCase();
  const mockOrder = KNOWN_ORDERS[cleanId] || (cleanId === 'PD-2048' ? KNOWN_ORDERS['PD-2048'] : undefined);

  const order: OrderData | undefined = backendOrder
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
            title: 'Order Received',
            time: new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
            current: backendOrder.orderStatus === 'ORDER_RECEIVED',
          },
          {
            title: 'In the Kitchen',
            time: backendOrder.orderStatus !== 'ORDER_RECEIVED' ? 'In Progress' : 'Up next',
            completed: backendOrder.orderStatus === 'IN_KITCHEN' || backendOrder.orderStatus === 'SENT_TO_DELIVERY',
            current: backendOrder.orderStatus === 'IN_KITCHEN',
          },
          {
            title: 'Out for Delivery',
            time: backendOrder.orderStatus === 'SENT_TO_DELIVERY' ? 'Dispatched' : 'Up next',
            completed: backendOrder.orderStatus === 'SENT_TO_DELIVERY',
            current: backendOrder.orderStatus === 'SENT_TO_DELIVERY',
          },
        ],
        items: [
          {
            id: String(backendOrder.id || backendOrder._id),
            name: backendOrder.pizza?.name || 'Custom Artisan Pizza',
            variant: `${backendOrder.customization?.base?.name || 'Classic Crust'} · ${backendOrder.customization?.cheese?.name || 'Mozzarella'}`,
            description: `Sauce: ${backendOrder.customization?.sauce?.name || 'Tomato'}${
              backendOrder.customization?.vegetables?.length
                ? ` · Veggies: ${backendOrder.customization.vegetables.map((v) => v.name).join(', ')}`
                : ''
            }`,
            price: Math.round((backendOrder.totalAmount - Math.round((backendOrder.totalAmount * 5) / 105)) / (backendOrder.quantity || 1)),
            quantity: backendOrder.quantity,
            image:
              backendOrder.pizza?.image ||
              'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
            productId: backendOrder.pizza?._id,
          },
        ],
        subtotal: backendOrder.totalAmount - Math.round((backendOrder.totalAmount * 5) / 105),
        deliveryFee: 0,
        taxes: Math.round((backendOrder.totalAmount * 5) / 105),
        totalPaid: backendOrder.totalAmount,
        paymentMethod: backendOrder.paymentStatus === 'SUCCESS' ? 'Paid via Razorpay' : 'Payment Pending',
        txnRef: backendOrder.razorpayPaymentId || backendOrder.razorpayOrderId || 'N/A',
        paymentTime: new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deliveryPartner: {
          name: 'Express Courier',
          role: 'Delivery Partner',
          rating: '4.9',
          deliveries: 'Active Order Fleet',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
        },
        deliveryAddress: {
          tag: 'Delivery',
          line1: 'Customer Address',
          line2: 'Express Delivery Hub',
          city: 'Order Destination',
        },
      }
    : mockOrder;

  const triggerNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleReorder = () => {
    if (!order) return;
    let addedCount = 0;

    order.items.forEach((item) => {
      const matched = allProducts.find(
        (p) => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase()
      );
      if (matched) {
        onAdd(matched);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      triggerNotice(`Added ${addedCount} item(s) from Order #${order.id} to your basket!`);
    } else {
      // Safe fallback if items cannot be reconstructed
      onNavigate('/menu');
    }
  };

  // If order is not found, render safe fallback
  if (!order) {
    return (
      <main className="order-details-page page-shell">
        <div className="order-not-found-card">
          <h2>Order Not Found</h2>
          <p>We couldn&apos;t find order #{orderId}. It may have expired or been placed under another account.</p>
          <button
            type="button"
            className="button button-outline"
            onClick={() => onNavigate('/orders')}
          >
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="order-details-page page-shell">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="order-details-toast" role="status">
          <Info size={16} />
          <span>{toastNotice}</span>
        </div>
      )}

      <div className="order-details-layout">
        {/* Main Order Workspace */}
        <section className="order-workspace">
          {/* Top Breadcrumb */}
          <nav className="order-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => onNavigate('/orders')}
              className="order-crumb-item"
            >
              <span>My Orders</span>
            </button>
            <ChevronRight size={13} className="order-crumb-sep" aria-hidden="true" />
            <span className="order-crumb-current" aria-current="page">
              Order #{order.id}
            </span>
          </nav>

          {/* Order Heading Row */}
          <div className="order-header-row">
            <div className="order-title-group">
              <div className="order-title-line">
                <h1 className="order-main-title">Order #{order.id}</h1>
                <span className="order-status-pill delivered">{order.status}</span>
              </div>
              <p className="order-placed-subtitle">Placed on {order.placedDate}</p>
            </div>

            <div className="order-top-actions">
              <button
                type="button"
                className="button button-outline reorder-btn"
                onClick={handleReorder}
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reorder</span>
              </button>
              <button
                type="button"
                className="icon-button more-actions-btn"
                onClick={() => triggerNotice('More order options are unavailable in this preview.')}
                aria-label="More order actions"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Main 2-Column Split: Center Content & Right Cards */}
          <div className="order-content-split">
            {/* Left/Center Column: Timeline & Items */}
            <div className="order-center-flow">
              {/* Order Status Timeline Card */}
              <div className="order-timeline-card">
                <div className="timeline-steps-track">
                  {order.timeline.map((step, idx) => (
                    <div className="timeline-step" key={step.title}>
                      <div className="step-indicator-wrap">
                        <span className={`timeline-dot ${step.completed ? 'completed' : ''}`}>
                          <Check size={14} />
                        </span>
                        {idx < order.timeline.length - 1 && (
                          <span className={`timeline-connector ${step.completed ? 'active' : ''}`} />
                        )}
                      </div>
                      <div className="step-text-wrap">
                        <strong className="step-title">{step.title}</strong>
                        <small className="step-time">{step.time}</small>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivered Status Reassurance Card */}
                <div className="delivery-success-banner">
                  <div className="success-icon-wrap">
                    <Bike size={20} className="text-emerald" aria-hidden="true" />
                  </div>
                  <div className="success-text-wrap">
                    <strong>Your order has been delivered!</strong>
                    <p>We hope you enjoyed your meal. Thank you for choosing PizzaDelight!</p>
                  </div>
                </div>
              </div>

              {/* Order Items Card */}
              <div className="order-items-card">
                <h2 className="order-items-card-title">Order Items</h2>

                <div className="order-items-list">
                  {order.items.map((item) => (
                    <div className="order-item-row" key={item.id}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="order-item-thumb"
                        loading="lazy"
                      />
                      <div className="order-item-info">
                        <strong className="order-item-title">{item.name}</strong>
                        <span className="order-item-variant">{item.variant}</span>
                        <p className="order-item-desc">{item.description}</p>
                      </div>
                      <div className="order-item-pricing">
                        <strong className="order-item-price">₹{item.price}</strong>
                        <span className="order-item-qty">x {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="order-totals-breakdown">
                  <div className="order-totals-line">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="order-totals-line">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                  <div className="order-totals-line">
                    <span>Taxes (GST)</span>
                    <span>₹{order.taxes}</span>
                  </div>

                  <div className="order-total-paid-row">
                    <strong>Total Paid</strong>
                    <strong className="total-paid-amount">₹{order.totalPaid}</strong>
                  </div>

                  {/* Payment Record */}
                  <div className="order-payment-record-row">
                    <div className="payment-record-left">
                      <CreditCard size={18} className="text-navy" aria-hidden="true" />
                      <div>
                        <strong>{order.paymentMethod}</strong>
                        <small>Txn ID: {order.txnRef}</small>
                      </div>
                    </div>
                    <div className="payment-record-right">
                      <strong>₹{order.totalPaid}</strong>
                      <small>{order.paymentTime}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Delivered By, Address, Help, Reorder Banner */}
            <div className="order-right-stack">
              {/* Card 1: Delivered by */}
              <div className="order-side-card delivery-partner-card">
                <h3 className="side-card-title">Delivered by</h3>
                <div className="partner-details-row">
                  <img
                    src={order.deliveryPartner.avatar}
                    alt={order.deliveryPartner.name}
                    className="partner-avatar"
                  />
                  <div className="partner-info">
                    <strong className="partner-name">{order.deliveryPartner.name}</strong>
                    <span className="partner-role">{order.deliveryPartner.role}</span>
                    <div className="partner-rating-row">
                      <span className="star-icon">★</span>
                      <span>{order.deliveryPartner.rating}</span>
                      <small>({order.deliveryPartner.deliveries})</small>
                    </div>
                  </div>
                </div>
                <div className="partner-actions-row">
                  <button
                    type="button"
                    className="button button-outline partner-action-btn"
                    onClick={() => triggerNotice('Driver phone communication is unavailable in this preview.')}
                  >
                    <Phone size={14} aria-hidden="true" />
                    <span>Call</span>
                  </button>
                  <button
                    type="button"
                    className="button button-outline partner-action-btn"
                    onClick={() => triggerNotice('Driver in-app messaging is unavailable in this preview.')}
                  >
                    <MessageSquare size={14} aria-hidden="true" />
                    <span>Message</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Delivery Address */}
              <div className="order-side-card address-card">
                <div className="address-card-header">
                  <MapPin size={16} className="text-brand" aria-hidden="true" />
                  <strong className="address-label">Delivery Address</strong>
                  <span className="address-tag-pill">{order.deliveryAddress.tag}</span>
                </div>
                <div className="address-body-text">
                  <p>{order.deliveryAddress.line1}</p>
                  <p>{order.deliveryAddress.line2}</p>
                  <p>{order.deliveryAddress.city}</p>
                </div>
              </div>

              {/* Card 3: Need Help with This Order? */}
              <div className="order-side-card help-card">
                <h3 className="side-card-title">Need Help with This Order?</h3>
                <div className="help-action-list">
                  <button
                    type="button"
                    className="help-action-row"
                    onClick={() => triggerNotice('Issue reporting is recorded for this preview session.')}
                  >
                    <div className="help-row-left">
                      <AlertTriangle size={16} className="text-brand" aria-hidden="true" />
                      <span>Report an Issue</span>
                    </div>
                    <ChevronRight size={15} className="help-chevron" />
                  </button>
                  <button
                    type="button"
                    className="help-action-row"
                    onClick={() => triggerNotice('Refund requests require customer support review. Contact help@pizzadelight.com.')}
                  >
                    <div className="help-row-left">
                      <CreditCard size={16} className="text-brand" aria-hidden="true" />
                      <span>Get a Refund</span>
                    </div>
                    <ChevronRight size={15} className="help-chevron" />
                  </button>
                  <button
                    type="button"
                    className="help-action-row"
                    onClick={() => triggerNotice('Customer support team is available 24/7 at 1800 123 456.')}
                  >
                    <div className="help-row-left">
                      <Headphones size={16} className="text-brand" aria-hidden="true" />
                      <span>Contact Support</span>
                    </div>
                    <ChevronRight size={15} className="help-chevron" />
                  </button>
                </div>
              </div>

              {/* Card 4: Same Great Taste? Reorder Again! Banner */}
              <div className="order-side-card reorder-promo-card">
                <div className="reorder-copy">
                  <p className="reorder-script-tag">Same Great Taste?</p>
                  <h4 className="reorder-lead-title">Order Again!</h4>
                </div>
                <button
                  type="button"
                  className="reorder-now-btn"
                  onClick={handleReorder}
                >
                  <span>Reorder Now</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <div className="reorder-bg-art" aria-hidden="true">🍕</div>
              </div>
            </div>
          </div>

          {/* 3. Bottom Section: You Might Also Like */}
          <section className="order-related-section" aria-labelledby="related-pizzas-title">
            <div className="related-section-header">
              <h2 id="related-pizzas-title" className="related-title">You Might Also Like</h2>
              <button
                type="button"
                className="view-menu-link"
                onClick={() => onNavigate('/menu')}
              >
                <span>View Menu</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="related-cards-grid">
              {allProducts.slice(0, 4).map((prod) => (
                <div className="related-pizza-card" key={prod.id}>
                  <div
                    className="related-thumb-wrap"
                    onClick={() => onNavigate(`/pizza/${prod.id}`)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${prod.name}`}
                  >
                    <img src={prod.image} alt={prod.name} loading="lazy" />
                  </div>
                  <div className="related-info-row">
                    <div
                      className="related-text-col"
                      onClick={() => onNavigate(`/pizza/${prod.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <strong className="related-pizza-name">{prod.name}</strong>
                      <span className="related-pizza-price">₹{prod.price}</span>
                    </div>
                    <button
                      type="button"
                      className="related-add-btn"
                      onClick={() => {
                        onAdd(prod);
                        triggerNotice(`Added ${prod.name} to your basket!`);
                      }}
                      aria-label={`Add ${prod.name} to cart`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
