import React, { useState, useMemo, useEffect } from 'react';
import { getAdminInventory, updateInventoryItem, BackendInventoryItem } from './services/adminApi';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Info,
  Leaf,
  Package,
  RotateCcw,
  Save,
  Search,
  X,
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Pizza Bases' | 'Sauces' | 'Cheeses' | 'Vegetables' | 'Bakery' | 'Condiments' | 'Dairy' | 'Herbs' | 'Meat' | 'Packaging' | 'Beverages' | 'Others';
  subCategory: string;
  currentStock: number;
  unit: string;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  description: string;
  sku: string;
  supplier: string;
  costPerUnit: number;
  lastPurchased: string;
  active: boolean;
  image: string;
  history: {
    date: string;
    change: string;
    previousStock: number;
    newStock: number;
    reason: string;
  }[];
}

const CATEGORY_MAP: Record<string, InventoryItem['category']> = {
  base: 'Pizza Bases',
  sauce: 'Sauces',
  cheese: 'Cheeses',
  vegetable: 'Vegetables',
};

const IMAGE_MAP: Record<string, string> = {
  base: 'https://images.pexels.com/photos/6287519/pexels-photo-6287519.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
  sauce: 'https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
  cheese: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
  vegetable: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
};

function mapBackendItemToInventory(b: BackendInventoryItem): InventoryItem {
  const category = CATEGORY_MAP[b.category] || 'Others';
  const status: InventoryItem['status'] =
    b.quantity === 0
      ? 'Out of Stock'
      : b.quantity <= b.threshold
      ? 'Low Stock'
      : 'In Stock';

  return {
    id: b._id,
    name: b.name,
    category,
    subCategory: 'Ingredients',
    currentStock: b.quantity,
    unit: b.unit || 'units',
    threshold: b.threshold,
    status,
    lastUpdated: b.updatedAt
      ? new Date(b.updatedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
      : 'Recent',
    description: `Fresh kitchen ingredient: ${b.name} (${category})`,
    sku: `ING-${(b.itemId || 'ITEM').toUpperCase()}`,
    supplier: 'PizzaDelight Commissary',
    costPerUnit: 50,
    lastPurchased: 'Active Stock',
    active: true,
    image: IMAGE_MAP[b.category] || IMAGE_MAP.vegetable,
    history: b.lowStockAlertSentAt
      ? [
          {
            date: new Date(b.lowStockAlertSentAt).toLocaleString(),
            change: 'Alert Triggered',
            previousStock: b.quantity,
            newStock: b.quantity,
            reason: 'Quantity below threshold alert dispatched to admin',
          },
        ]
      : [],
  };
}

interface AdminInventoryProps {
  onNavigate?: (path: string) => void;
}

export function AdminInventory(props?: AdminInventoryProps) {
  void props;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerMode, setDrawerMode] = useState<'edit' | 'add'>('edit');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history' | 'supplier'>('details');

  // Drawer Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>('Vegetables');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('units');
  const [formSku, setFormSku] = useState('');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(0);
  const [formThreshold, setFormThreshold] = useState<number>(20);

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const loadInventory = () => {
    setLoading(true);
    getAdminInventory()
      .then((res) => {
        if (res.success && res.data?.inventory?.length) {
          const mapped = res.data.inventory.map(mapBackendItemToInventory);
          setItems(mapped);
          if (!selectedItem && mapped[0]) {
            syncFormWithItem(mapped[0]);
          } else if (selectedItem) {
            const found = mapped.find((m) => m.id === selectedItem.id);
            if (found) syncFormWithItem(found);
          }
        }
      })
      .catch(() => {
        showToast('Failed to load inventory from backend.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFormWithItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormUnit(item.unit);
    setFormSku(item.sku);
    setFormCurrentStock(item.currentStock);
    setFormThreshold(item.threshold);
  };

  const openEditDrawer = (item: InventoryItem) => {
    setDrawerMode('edit');
    setDrawerTab('details');
    syncFormWithItem(item);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    const parsedStock = Number(formCurrentStock);
    const parsedThreshold = Number(formThreshold);

    if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      setFormError('Current stock must be a non-negative integer.');
      return;
    }
    if (isNaN(parsedThreshold) || parsedThreshold < 0 || !Number.isInteger(parsedThreshold)) {
      setFormError('Threshold must be a non-negative integer.');
      return;
    }

    if (drawerMode === 'edit' && selectedItem) {
      setIsSaving(true);
      try {
        const res = await updateInventoryItem(selectedItem.id, {
          quantity: parsedStock,
          threshold: parsedThreshold,
        });

        if (res.success && res.data?.inventory) {
          const fresh = mapBackendItemToInventory(res.data.inventory);
          setItems((prev) => prev.map((it) => (it.id === selectedItem.id ? fresh : it)));
          syncFormWithItem(fresh);
          showToast(`Successfully updated ${fresh.name} in MongoDB! Stock: ${fresh.currentStock}, Threshold: ${fresh.threshold}`);
          setFormError(null);
        } else {
          setFormError(res.error || 'Failed to persist stock update to MongoDB.');
          showToast(res.error || 'Update failed.');
        }
      } catch {
        setFormError('Network error connecting to backend.');
        showToast('Network error while updating inventory.');
      } finally {
        setIsSaving(false);
      }
    } else {
      showToast('New items can be added directly via commissary catalog.');
      setIsDrawerOpen(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'CurrentStock', 'Unit', 'Threshold', 'Status', 'SKU', 'Supplier'];
    const rows = filteredItems.map((it) => [
      it.id,
      `"${it.name}"`,
      it.category,
      it.currentStock,
      it.unit,
      it.threshold,
      it.status,
      it.sku,
      `"${it.supplier}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pizzadelight-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory exported to CSV.');
  };

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category Tab filter
      if (activeCategoryTab !== 'All Items' && item.category !== activeCategoryTab) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchSup = item.supplier.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchSku && !matchSup) {
          return false;
        }
      }

      // Category Dropdown
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      // Status Dropdown
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stockAsc') return a.currentStock - b.currentStock;
      if (sortBy === 'stockDesc') return b.currentStock - a.currentStock;
      if (sortBy === 'threshold') return a.threshold - b.threshold;
      return 0;
    });
  }, [items, activeCategoryTab, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // KPI Calculations
  const totalCount = items.length;
  const inStockCount = items.filter((i) => i.currentStock > i.threshold).length;
  const lowStockCount = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.threshold).length;
  const outOfStockCount = items.filter((i) => i.currentStock === 0).length;

  // Category counts
  const basesCount = items.filter((i) => i.category === 'Pizza Bases').length;
  const saucesCount = items.filter((i) => i.category === 'Sauces').length;
  const cheesesCount = items.filter((i) => i.category === 'Cheeses').length;
  const vegetablesCount = items.filter((i) => i.category === 'Vegetables').length;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(paginatedItems.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedItemIds.includes(item.id));

  return (
    <div className="admin-inventory-page">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="inventory-toast-banner" role="status">
          <Info size={16} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className={`inventory-workspace-layout ${isDrawerOpen ? 'drawer-open' : 'drawer-closed'}`}>
        {/* Left / Main Workspace */}
        <section className="inventory-main-content">
          {/* Page Header */}
          <div className="inventory-page-header">
            <div className="header-titles">
              <h1 className="inventory-main-heading">Inventory</h1>
              <p className="inventory-subtitle">
                Track, update and manage stock for pizza bases, sauces, cheeses and vegetables.
              </p>
            </div>

            <div className="header-actions-group">
              <button
                type="button"
                className="button button-outline inventory-action-outline-btn"
                onClick={handleExportCSV}
              >
                <Download size={15} aria-hidden="true" />
                <span>Export</span>
              </button>

              <button
                type="button"
                className="button inventory-primary-add-btn"
                onClick={loadInventory}
                disabled={loading}
              >
                <RotateCcw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards Grid */}
          <div className="inventory-summary-grid">
            <div className="summary-card total-items-card">
              <div className="summary-icon-box total-icon" aria-hidden="true">
                <Package size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Total Items</span>
                <strong className="summary-value">{totalCount}</strong>
                <span className="summary-subtext">All tracked stock</span>
              </div>
            </div>

            <div className="summary-card low-stock-card">
              <div className="summary-icon-box low-stock-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Low Stock</span>
                <strong className="summary-value">{lowStockCount}</strong>
                <span className="summary-subtext warning">Requires attention</span>
              </div>
            </div>

            <div className="summary-card in-stock-card">
              <div className="summary-icon-box in-stock-icon" aria-hidden="true">
                <Leaf size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">In Stock</span>
                <strong className="summary-value">{inStockCount}</strong>
                <span className="summary-subtext success">Sufficient supply</span>
              </div>
            </div>

            <div className="summary-card out-of-stock-card">
              <div className="summary-icon-box out-of-stock-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Out of Stock</span>
                <strong className="summary-value">{outOfStockCount}</strong>
                <span className="summary-subtext danger">Replenish soon</span>
              </div>
            </div>
          </div>

          {/* Category Tabs: Required 4 ingredient categories */}
          <div className="inventory-category-tabs" role="tablist" aria-label="Inventory categories">
            {[
              { label: 'All Items', count: totalCount },
              { label: 'Pizza Bases', count: basesCount },
              { label: 'Sauces', count: saucesCount },
              { label: 'Cheeses', count: cheesesCount },
              { label: 'Vegetables', count: vegetablesCount },
            ].map((tab) => {
              const isActive = activeCategoryTab === tab.label;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategoryTab(tab.label);
                    setCurrentPage(1);
                  }}
                >
                  <span>{tab.label}</span>
                  <span className="tab-count-badge">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Search and Filters Toolbar */}
          <div className="inventory-filter-toolbar">
            <div className="filter-search-box">
              <Search size={15} className="filter-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter items"
              />
            </div>

            <div className="filter-dropdowns-row">
              <div className="select-wrapper">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by category"
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Pizza Bases">Pizza Bases</option>
                  <option value="Sauces">Sauces</option>
                  <option value="Cheeses">Cheeses</option>
                  <option value="Vegetables">Vegetables</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>

              <div className="select-wrapper">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                  className="filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>

              <div className="select-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort by"
                  className="filter-select"
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="stockAsc">Sort: Stock (Low to High)</option>
                  <option value="stockDesc">Sort: Stock (High to Low)</option>
                  <option value="threshold">Sort: Threshold</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Inventory Data Table */}
          <div className="inventory-table-container">
            <table className="inventory-data-table" aria-label="Inventory Items Table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all items on this page"
                    />
                  </th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Unit</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const isRowSelected = selectedItem?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`inventory-table-row ${isRowSelected ? 'selected-row' : ''}`}
                      onClick={() => openEditDrawer(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="td-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </td>

                      <td className="td-item-info">
                        <div className="item-thumbnail-cell">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="item-row-avatar"
                            loading="lazy"
                          />
                          <div className="item-name-meta">
                            <span className="item-row-name">{item.name}</span>
                            <span className="item-row-sku">{item.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="td-category">
                        <span className="category-pill">{item.category}</span>
                      </td>

                      <td className="td-stock">
                        <span
                          className={`stock-value-cell ${
                            item.currentStock === 0
                              ? 'out-of-stock-num'
                              : item.currentStock <= item.threshold
                              ? 'low-stock-num'
                              : 'in-stock-num'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                      </td>

                      <td className="td-unit">
                        <span className="unit-label">{item.unit}</span>
                      </td>

                      <td className="td-threshold">
                        <span className="threshold-label">{item.threshold}</span>
                      </td>

                      <td className="td-status">
                        <span
                          className={`inventory-status-pill ${
                            item.status === 'In Stock'
                              ? 'status-in-stock'
                              : item.status === 'Low Stock'
                              ? 'status-low-stock'
                              : 'status-out-of-stock'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="td-last-updated">
                        <span className="last-updated-text">{item.lastUpdated}</span>
                      </td>

                      <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="row-action-btns">
                          <button
                            type="button"
                            className="edit-row-btn"
                            onClick={() => openEditDrawer(item)}
                            aria-label={`Edit ${item.name}`}
                            title="Edit Item"
                          >
                            <Edit2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedItems.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="empty-table-cell">
                      <div className="empty-search-state">
                        <Package size={32} aria-hidden="true" />
                        <p>No inventory items found matching your filters.</p>
                        <button
                          type="button"
                          className="button button-small button-outline"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('All');
                            setStatusFilter('All');
                            setActiveCategoryTab('All Items');
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <div className="inventory-pagination-row">
              <span className="pagination-info-text">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
              </span>

              <div className="pagination-action-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span>Previous</span>
                </button>

                <div className="page-number-indicators">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Slide-Over Edit Drawer */}
        {isDrawerOpen && selectedItem && (
          <aside className="inventory-edit-drawer" aria-label="Item Details & Adjustment Drawer">
            <div className="drawer-header-strip">
              <div className="drawer-header-left">
                <h2 className="drawer-main-title">
                  {drawerMode === 'edit' ? selectedItem.name : 'Add New Item'}
                </h2>
                <span className="drawer-sku-tag">{formSku}</span>
              </div>

              <div className="drawer-header-actions">
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={closeDrawer}
                  aria-label="Close drawer"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="drawer-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'details'}
                className={`drawer-tab-btn ${drawerTab === 'details' ? 'active' : ''}`}
                onClick={() => setDrawerTab('details')}
              >
                Details
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'history'}
                className={`drawer-tab-btn ${drawerTab === 'history' ? 'active' : ''}`}
                onClick={() => setDrawerTab('history')}
              >
                Stock History
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'supplier'}
                className={`drawer-tab-btn ${drawerTab === 'supplier' ? 'active' : ''}`}
                onClick={() => setDrawerTab('supplier')}
              >
                Supplier Info
              </button>
            </div>

            {formError && (
              <div className="drawer-form-alert error" role="alert">
                <AlertTriangle size={15} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {/* Tab 1: Details / Form */}
            {drawerTab === 'details' && (
              <form className="drawer-form-body" onSubmit={handleSaveItem}>
                <div className="drawer-form-group">
                  <label htmlFor="drawer-item-name" className="drawer-form-label">
                    Item Name
                  </label>
                  <input
                    id="drawer-item-name"
                    type="text"
                    className="drawer-form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="drawer-form-row">
                  <div className="drawer-form-group">
                    <label htmlFor="drawer-item-category" className="drawer-form-label">
                      Category
                    </label>
                    <input
                      id="drawer-item-category"
                      type="text"
                      className="drawer-form-input"
                      value={formCategory}
                      readOnly
                      style={{ background: '#f5f5f4' }}
                    />
                  </div>

                  <div className="drawer-form-group">
                    <label htmlFor="drawer-item-unit" className="drawer-form-label">
                      Unit of Measure
                    </label>
                    <input
                      id="drawer-item-unit"
                      type="text"
                      className="drawer-form-input"
                      value={formUnit}
                      readOnly
                      style={{ background: '#f5f5f4' }}
                    />
                  </div>
                </div>

                <div className="drawer-form-row stock-highlight-row">
                  <div className="drawer-form-group">
                    <label htmlFor="drawer-current-stock" className="drawer-form-label highlight-label">
                      Current Stock ({formUnit})
                    </label>
                    <input
                      id="drawer-current-stock"
                      type="number"
                      min="0"
                      className="drawer-form-input highlight-input"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      required
                    />
                    <small className="form-subtext">Directly update MongoDB stock quantity.</small>
                  </div>

                  <div className="drawer-form-group">
                    <label htmlFor="drawer-threshold" className="drawer-form-label highlight-label">
                      Low-Stock Threshold
                    </label>
                    <input
                      id="drawer-threshold"
                      type="number"
                      min="0"
                      className="drawer-form-input highlight-input"
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      required
                    />
                    <small className="form-subtext">Triggers automated node-cron alert.</small>
                  </div>
                </div>

                <div className="drawer-form-group">
                  <label htmlFor="drawer-description" className="drawer-form-label">
                    Description
                  </label>
                  <textarea
                    id="drawer-description"
                    rows={3}
                    className="drawer-form-textarea"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="drawer-footer-actions">
                  <button
                    type="button"
                    className="drawer-cancel-btn"
                    onClick={closeDrawer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="drawer-save-btn"
                    disabled={isSaving}
                  >
                    <Save size={15} aria-hidden="true" className={isSaving ? 'animate-spin' : ''} />
                    <span>{isSaving ? 'Saving to DB...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Stock History */}
            {drawerTab === 'history' && (
              <div className="drawer-history-body">
                <p className="history-intro-text">
                  Stock adjustment records and system automated alerts for {selectedItem.name}.
                </p>
                <div className="history-timeline-list">
                  {selectedItem.history.length > 0 ? (
                    selectedItem.history.map((h, i) => (
                      <div key={i} className="history-timeline-entry">
                        <div className="entry-dot" />
                        <div className="entry-content">
                          <div className="entry-top">
                            <strong className="entry-change">{h.change}</strong>
                            <span className="entry-date">{h.date}</span>
                          </div>
                          <p className="entry-reason">{h.reason}</p>
                          <small className="entry-delta">
                            Stock: {h.previousStock} &rarr; {h.newStock} {selectedItem.unit}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="history-empty">
                      <Clock size={20} aria-hidden="true" />
                      <span>No prior alerts or historical stock adjustments recorded.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Supplier Info */}
            {drawerTab === 'supplier' && (
              <div className="drawer-supplier-body">
                <div className="supplier-card">
                  <h3>Commissary Supply Channel</h3>
                  <div className="supplier-field">
                    <span>Supplier Name:</span>
                    <strong>{selectedItem.supplier}</strong>
                  </div>
                  <div className="supplier-field">
                    <span>SKU Code:</span>
                    <strong>{selectedItem.sku}</strong>
                  </div>
                  <div className="supplier-field">
                    <span>Internal Cost/Unit:</span>
                    <strong>₹{selectedItem.costPerUnit} / {selectedItem.unit}</strong>
                  </div>
                  <div className="supplier-field">
                    <span>Status:</span>
                    <strong className="text-green-600">Active Supply</strong>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
