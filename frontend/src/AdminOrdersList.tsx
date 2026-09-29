import { useState, useMemo, useEffect } from 'react';
import { getAdminOrders, updateOrderStatus } from './services/adminApi';
import { BackendOrder } from './services/orderApi';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  RefreshCw,
  Search,
  Truck,
  Utensils,
  X,
} from 'lucide-react';

interface AdminOrdersListProps {
  onNavigate: (path: string) => void;
  onOrderCountChange?: (count: number) => void;
}

export function AdminOrdersList({ onNavigate, onOrderCountChange }: AdminOrdersListProps) {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filters state
  const [activeTab, setActiveTab] = useState<string>('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminOrders();
      if (res.success && res.data?.orders) {
        setOrders(res.data.orders);
        if (onOrderCountChange) {
          onOrderCountChange(res.data.orders.length);
        }
      } else {
        setError(res.error || 'Failed to load customer orders from backend.');
      }
    } catch {
      setError('Network error occurred while fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAdminOrders()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data?.orders) {
            setOrders(res.data.orders);
            onOrderCountChange?.(res.data.orders.length);
          } else {
            setError(res.error || 'Failed to load customer orders from backend.');
          }
        }
      })
      .catch(() => {
        if (isMounted) setError('Network error occurred while fetching orders.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [onOrderCountChange]);

  // Summary counts
  const totalOrders = orders.length;
  const pendingCount = orders.filter(
    (o) => o.orderStatus === 'ORDER_RECEIVED' && o.paymentStatus !== 'FAILED'
  ).length;
  const kitchenCount = orders.filter((o) => o.orderStatus === 'IN_KITCHEN').length;
  const outForDeliveryCount = orders.filter((o) => o.orderStatus === 'SENT_TO_DELIVERY').length;
  const deliveredCount = orders.filter(
    (o) => o.orderStatus === 'SENT_TO_DELIVERY' && o.paymentStatus === 'SUCCESS'
  ).length;
  const cancelledCount = orders.filter((o) => o.paymentStatus === 'FAILED').length;

  // Filter tabs definition
  const filterTabs = [
    { label: 'All Orders', count: totalOrders },
    { label: 'Pending', count: pendingCount },
    { label: 'In The Kitchen', count: kitchenCount },
    { label: 'Out for Delivery', count: outForDeliveryCount },
    { label: 'Delivered', count: deliveredCount },
    { label: 'Cancelled', count: cancelledCount },
  ];

  // Quick status advance
  const handleQuickAdvance = async (e: React.MouseEvent, ord: BackendOrder) => {
    e.stopPropagation();
    const orderId = String(ord.id || ord._id);
    let nextStatus: string | null = null;
    if (ord.orderStatus === 'ORDER_RECEIVED') nextStatus = 'IN_KITCHEN';
    else if (ord.orderStatus === 'IN_KITCHEN') nextStatus = 'SENT_TO_DELIVERY';

    if (!nextStatus) {
      showToast('Order has already reached final dispatch status.');
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.success && res.data?.order) {
        showToast(`Order #${orderId.slice(-8).toUpperCase()} updated to ${nextStatus.replace(/_/g, ' ')}!`);
        // Refresh local orders list
        setOrders((prev) =>
          prev.map((o) => (String(o.id || o._id) === orderId ? { ...o, orderStatus: res.data!.order.orderStatus } : o))
        );
      } else {
        showToast(res.error || 'Failed to update order status.');
      }
    } catch {
      showToast('Network error while updating status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderId = String(o.id || o._id).toLowerCase();
      const customerName = (typeof o.user === 'object' && o.user?.name ? o.user.name : '').toLowerCase();
      const customerEmail = (typeof o.user === 'object' && o.user?.email ? o.user.email : '').toLowerCase();
      const pizzaName = (o.pizza?.name || 'custom').toLowerCase();

      // Tab filter
      if (activeTab === 'Pending' && o.orderStatus !== 'ORDER_RECEIVED') return false;
      if (activeTab === 'In The Kitchen' && o.orderStatus !== 'IN_KITCHEN') return false;
      if (activeTab === 'Out for Delivery' && o.orderStatus !== 'SENT_TO_DELIVERY') return false;
      if (activeTab === 'Delivered' && (o.orderStatus !== 'SENT_TO_DELIVERY' || o.paymentStatus !== 'SUCCESS')) return false;
      if (activeTab === 'Cancelled' && o.paymentStatus !== 'FAILED') return false;

      // Dropdown status filter
      if (statusFilter !== 'All' && o.orderStatus !== statusFilter) return false;

      // Dropdown payment filter
      if (paymentFilter !== 'All' && o.paymentStatus !== paymentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          orderId.includes(q) ||
          customerName.includes(q) ||
          customerEmail.includes(q) ||
          pizzaName.includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.totalAmount - a.totalAmount;
      return 0;
    });
  }, [orders, activeTab, statusFilter, paymentFilter, searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <div className="admin-orders-list-view">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="admin-order-toast" role="status" style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000 }}>
          <AlertCircle size={16} aria-hidden="true" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="orders-page-header">
        <div>
          <p className="eyebrow">ORDER MANAGEMENT</p>
          <h1 className="orders-main-title">Orders</h1>
          <p className="orders-subtitle">View and manage all customer orders.</p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={loadOrders}
          disabled={loading}
          aria-label="Refresh orders list"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="orders-summary-grid">
        <div className="orders-summary-card">
          <div className="summary-card-icon-wrap icon-total">
            <Package size={20} />
          </div>
          <div className="summary-card-text">
            <span className="summary-card-label">Total Orders</span>
            <strong className="summary-card-value">{totalOrders}</strong>
            <small className="summary-card-subtext">All recorded</small>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-card-icon-wrap icon-pending">
            <Clock size={20} />
          </div>
          <div className="summary-card-text">
            <span className="summary-card-label">Pending</span>
            <strong className="summary-card-value">{pendingCount}</strong>
            <small className="summary-card-subtext">Order received</small>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-card-icon-wrap icon-kitchen">
            <Utensils size={20} />
          </div>
          <div className="summary-card-text">
            <span className="summary-card-label">In The Kitchen</span>
            <strong className="summary-card-value">{kitchenCount}</strong>
            <small className="summary-card-subtext">Prep in progress</small>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-card-icon-wrap icon-delivery">
            <Truck size={20} />
          </div>
          <div className="summary-card-text">
            <span className="summary-card-label">Out for Delivery</span>
            <strong className="summary-card-value">{outForDeliveryCount}</strong>
            <small className="summary-card-subtext">Fleet dispatched</small>
          </div>
        </div>

        <div className="orders-summary-card">
          <div className="summary-card-icon-wrap icon-delivered">
            <CheckCircle2 size={20} />
          </div>
          <div className="summary-card-text">
            <span className="summary-card-label">Delivered</span>
            <strong className="summary-card-value">{deliveredCount}</strong>
            <small className="summary-card-subtext">Completed</small>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="orders-category-tabs" role="tablist">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`orders-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.label);
                setCurrentPage(1);
              }}
            >
              <span>{tab.label}</span>
              <span className="orders-tab-count-badge">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-search-box">
          <Search size={16} className="orders-search-icon" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by Order ID, customer name, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search orders"
          />
          {searchQuery && (
            <button
              type="button"
              className="orders-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="orders-filter-dropdowns">
          <div className="orders-select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
              className="orders-select"
            >
              <option value="All">All Statuses</option>
              <option value="ORDER_RECEIVED">Order Received</option>
              <option value="IN_KITCHEN">In Kitchen</option>
              <option value="SENT_TO_DELIVERY">Sent to Delivery</option>
            </select>
          </div>

          <div className="orders-select-wrapper">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Payment Method"
              className="orders-select"
            >
              <option value="All">All Payments</option>
              <option value="SUCCESS">Paid (Success)</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="orders-select-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest')}
              aria-label="Sort orders"
              className="orders-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="orders-table-card">
        {loading ? (
          <div className="orders-loading-state">
            <RefreshCw size={24} className="animate-spin text-red" />
            <p>Loading real orders from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="orders-error-state">
            <AlertCircle size={24} className="text-red" />
            <p>{error}</p>
            <button type="button" className="button button-small" onClick={loadOrders}>
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <Package size={32} />
            <h3>No orders found</h3>
            <p>No customer orders match your active search and filter criteria.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Order Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((ord) => {
                  const orderId = String(ord.id || ord._id);
                  const shortId = `#${orderId.slice(-8).toUpperCase()}`;
                  const customerName =
                    typeof ord.user === 'object' && ord.user?.name ? ord.user.name : 'Customer';
                  const customerEmail =
                    typeof ord.user === 'object' && ord.user?.email ? ord.user.email : '';
                  const itemName = ord.pizza?.name || 'Custom Pizza';
                  const quantity = ord.quantity || 1;
                  const itemSummary = `${itemName} (x${quantity})`;

                  let nextTransition: string | null = null;
                  if (ord.orderStatus === 'ORDER_RECEIVED') nextTransition = 'IN_KITCHEN';
                  else if (ord.orderStatus === 'IN_KITCHEN') nextTransition = 'SENT_TO_DELIVERY';

                  return (
                    <tr
                      key={orderId}
                      onClick={() => onNavigate(`/admin/orders/${orderId}`)}
                      style={{ cursor: 'pointer' }}
                      className="order-row"
                    >
                      <td>
                        <strong className="order-id-code">{shortId}</strong>
                        <small className="order-id-sub">{orderId.slice(0, 10)}...</small>
                      </td>
                      <td>
                        <span className="customer-name-text">{customerName}</span>
                        {customerEmail && <small className="customer-email-sub">{customerEmail}</small>}
                      </td>
                      <td>
                        <span className="item-name-cell">{itemSummary}</span>
                        {ord.customization && (
                          <small className="item-custom-sub">
                            {ord.customization.base?.name || 'Classic'} · {ord.customization.cheese?.name || 'Mozzarella'}
                          </small>
                        )}
                      </td>
                      <td>
                        <strong className="amount-cell">₹{ord.totalAmount}</strong>
                      </td>
                      <td>
                        <span
                          className={`payment-badge ${
                            ord.paymentStatus === 'SUCCESS'
                              ? 'payment-success'
                              : ord.paymentStatus === 'FAILED'
                              ? 'payment-failed'
                              : 'payment-pending'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`order-status-badge ${
                            ord.orderStatus === 'SENT_TO_DELIVERY'
                              ? 'status-delivery'
                              : ord.orderStatus === 'IN_KITCHEN'
                              ? 'status-kitchen'
                              : 'status-received'
                          }`}
                        >
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="time-cell">
                          {new Date(ord.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <small className="time-sub">
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="order-actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="order-action-view-btn"
                            onClick={() => onNavigate(`/admin/orders/${orderId}`)}
                            title="View Order Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          {nextTransition && (
                            <button
                              type="button"
                              className="order-action-advance-btn"
                              disabled={updatingOrderId === orderId}
                              onClick={(e) => handleQuickAdvance(e, ord)}
                              title={`Advance to ${nextTransition.replace(/_/g, ' ')}`}
                            >
                              <RefreshCw size={13} className={updatingOrderId === orderId ? 'animate-spin' : ''} />
                              <span>{nextTransition === 'IN_KITCHEN' ? 'Kitchen' : 'Dispatch'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="orders-pagination-bar">
            <span className="pagination-count-note">
              Showing {(currentPage - 1) * ordersPerPage + 1} to{' '}
              {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="pagination-btns-wrap">
              <button
                type="button"
                className="pagination-arrow-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="pagination-page-indicator">
                {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pagination-arrow-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
