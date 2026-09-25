import { useState, useEffect } from 'react';
import { updateUserProfile, getCurrentUser, getStoredUser } from './services/auth';
import {
  Home,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  Heart,
  MapPin,
  CreditCard,
  User,
  Bell,
  Settings,
  Camera,
  Crown,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Sparkles,
  KeyRound,
  Trash2,
  CheckCircle2,
  Leaf,
  ShoppingBag,
  Star,
  Info,
} from 'lucide-react';

interface ProfileProps {
  onNavigate: (path: string) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'payment' | 'preferences' | 'security'>('personal');
  
  // Safe presentation fallbacks (not claiming verified customer backend data)
  const [fullName, setFullName] = useState('Valued Customer');
  const [email, setEmail] = useState('customer@example.com');
  const [phone, setPhone] = useState('98765 43210');
  const [dob, setDob] = useState('2000-01-01');
  const [gender, setGender] = useState('Prefer not to say');
  const [memberSince, setMemberSince] = useState('Member since 2026');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Notification / notice popup
  const [notice, setNotice] = useState<string | null>(null);

  // Preference toggles (local UI session state only)
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [emailOffers, setEmailOffers] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);

  // Retrieve real authenticated user details from Express backend
  useEffect(() => {
    const local = getStoredUser();
    if (local) {
      if (local.name) setFullName(local.name);
      if (local.email) setEmail(local.email);
    }

    getCurrentUser()
      .then((res) => {
        if (res.success && res.data?.user) {
          setFullName(res.data.user.name);
          setEmail(res.data.user.email);
          if (res.data.user.createdAt) {
            setMemberSince(`Member since ${new Date(res.data.user.createdAt).getFullYear()}`);
          }
        }
      })
      .catch(() => {
        // Fall back gracefully
      });
  }, []);

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMessage(null);

    const res = await updateUserProfile(fullName);
    setIsSaving(false);

    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: 'Profile name updated successfully.',
      });
    } else {
      // Backend profile update not available or user not logged in: inform user honestly
      setFeedbackMessage({
        type: 'info',
        text: res.error || 'Changes saved for this local session only.',
      });
    }

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <main className="profile-page page-shell">
      {/* Toast Notice */}
      {notice && (
        <div className="profile-toast" role="status">
          <Info size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Main 2-Column Shell */}
      <div className="profile-shell-layout">
        {/* 1. Left Customer Account Sidebar */}
        <aside className="profile-sidebar" aria-label="Account navigation">
          <nav className="profile-sidebar-nav">
            <button
              type="button"
              className="profile-sidebar-item"
              onClick={() => onNavigate('/dashboard')}
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className="profile-sidebar-item"
              onClick={() => onNavigate('/orders')}
            >
              <Receipt size={18} aria-hidden="true" />
              <span>My Orders</span>
            </button>
            <button
              type="button"
              className="profile-sidebar-item"
              onClick={() => triggerNotice('Favorites feature is unavailable in this preview.')}
            >
              <Heart size={18} aria-hidden="true" />
              <span>Favorites</span>
            </button>
            <button
              type="button"
              className={`profile-sidebar-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} aria-hidden="true" />
              <span>Addresses</span>
            </button>
            <button
              type="button"
              className={`profile-sidebar-item ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              <CreditCard size={18} aria-hidden="true" />
              <span>Payment Methods</span>
            </button>
            <button
              type="button"
              className={`profile-sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={18} aria-hidden="true" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              className="profile-sidebar-item"
              onClick={() => triggerNotice('Notifications are currently unavailable in this preview.')}
            >
              <Bell size={18} aria-hidden="true" />
              <span>Notifications</span>
            </button>
            <button
              type="button"
              className="profile-sidebar-item"
              onClick={() => triggerNotice('Account settings are currently unavailable in this preview.')}
            >
              <Settings size={18} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Promotional Card at bottom of sidebar */}
          <div className="profile-sidebar-promo">
            <div className="promo-tag">
              <span className="promo-pizza-icon">🍕</span>
              <p className="promo-handwritten">
                Good Food
                <br />
                Better You <span className="text-brand">♥</span>
              </p>
            </div>
            <div className="promo-photo-wrap">
              <img
                src="https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=300&w=300"
                alt="Fresh artisan pizza slice"
                loading="lazy"
              />
            </div>
          </div>
        </aside>

        {/* 2. Main Profile Workspace */}
        <section className="profile-workspace">
          {/* Breadcrumb */}
          <nav className="profile-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="profile-crumb-item"
            >
              <Home size={14} aria-hidden="true" />
              <span>Home</span>
            </button>
            <ChevronRight size={13} className="profile-crumb-sep" aria-hidden="true" />
            <span className="profile-crumb-current" aria-current="page">
              Profile
            </span>
          </nav>

          {/* Page Heading */}
          <div className="profile-heading-group">
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">
              Manage your account information, preferences and more.
            </p>
          </div>

          {/* Top Profile Summary + Premium Member Cards */}
          <div className="profile-top-grid">
            {/* Profile Summary Card */}
            <div className="profile-summary-card">
              <div className="summary-left-group">
                {/* Circular Avatar */}
                <div className="profile-avatar-wrap">
                  <img
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=160&w=160"
                    alt={fullName}
                    className="profile-avatar-img"
                  />
                  <span className="avatar-camera-badge" aria-label="Avatar photo">
                    <Camera size={13} />
                  </span>
                </div>

                {/* Profile Details */}
                <div className="profile-details-col">
                  <div className="profile-name-row">
                    <strong className="profile-name-text">{fullName}</strong>
                    <span className="premium-pill-badge">
                      <Crown size={12} className="text-amber" aria-hidden="true" />
                      <span>Premium Member</span>
                    </span>
                  </div>

                  <div className="profile-contact-list">
                    <span className="contact-meta-item">
                      <Mail size={13} aria-hidden="true" />
                      <span>{email}</span>
                    </span>
                    <span className="contact-meta-item">
                      <Phone size={13} aria-hidden="true" />
                      <span>+91 {phone}</span>
                    </span>
                    <span className="contact-meta-item">
                      <MapPin size={13} aria-hidden="true" />
                      <span>Kolkata, West Bengal</span>
                    </span>
                  </div>

                  <div className="profile-meta-stats-row">
                    <span className="stat-meta-pill">{memberSince}</span>
                    <span className="stat-meta-pill">
                      <ShoppingBag size={13} aria-hidden="true" />
                      <span>24 Orders</span>
                    </span>
                    <span className="stat-meta-pill">
                      <Heart size={13} className="text-brand" aria-hidden="true" />
                      <span>12 Favorites</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Photo Action */}
              <button
                type="button"
                className="button button-outline edit-photo-btn"
                onClick={() => triggerNotice('Photo upload is unavailable in this preview.')}
              >
                <Camera size={15} aria-hidden="true" />
                <span>Edit Photo</span>
              </button>
            </div>

            {/* Premium Member Callout Card */}
            <div className="premium-member-card">
              <div className="premium-icon-badge">
                <Crown size={22} className="text-brand" aria-hidden="true" />
              </div>
              <h3>You&apos;re a Premium Member!</h3>
              <p>Enjoy exclusive offers, faster checkout and more benefits.</p>
              <button
                type="button"
                className="button button-outline premium-view-btn"
                onClick={() => triggerNotice('Membership tier benefits: 10% off custom crusts & free delivery on orders above ₹499.')}
              >
                <span>View Benefits</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Horizontal Profile Tabs Bar */}
          <div className="profile-tabs-bar" role="tablist" aria-label="Profile navigation sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'personal'}
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={16} aria-hidden="true" />
              <span>Personal Information</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'addresses'}
              className={`profile-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={16} aria-hidden="true" />
              <span>Addresses</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'payment'}
              className={`profile-tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              <CreditCard size={16} aria-hidden="true" />
              <span>Payment Methods</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'preferences'}
              className={`profile-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Sliders size={16} aria-hidden="true" />
              <span>Preferences</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'security'}
              className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Security</span>
            </button>
          </div>

          {/* Feedback message banner */}
          {feedbackMessage && (
            <div className={`profile-status-banner ${feedbackMessage.type}`}>
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <Info size={16} aria-hidden="true" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Main Workspace Body: 2 Columns */}
          <div className="profile-content-grid">
            {/* Left Column: Tab Panels */}
            <div className="profile-tab-panel">
              {/* Tab 1: Personal Information Form */}
              {activeTab === 'personal' && (
                <div className="profile-card form-card">
                  <div className="card-head-simple">
                    <h2>Personal Information</h2>
                    <p>Keep your personal details up to date.</p>
                  </div>

                  <form onSubmit={handleSaveChanges} className="personal-info-form">
                    <div className="form-fields-grid">
                      {/* Full Name */}
                      <div className="form-field-group">
                        <label htmlFor="profile-full-name">Full Name</label>
                        <input
                          id="profile-full-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      {/* Email Address (Read-only for security) */}
                      <div className="form-field-group">
                        <label htmlFor="profile-email">
                          Email Address <small className="read-only-note">(Account identity)</small>
                        </label>
                        <input
                          id="profile-email"
                          type="email"
                          value={email}
                          readOnly
                          className="input-read-only"
                          title="Email address is bound to your account credentials"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="form-field-group">
                        <label htmlFor="profile-phone">Phone Number</label>
                        <div className="phone-input-wrap">
                          <span className="phone-country-pill">
                            <span>🇮🇳</span>
                            <strong>+91</strong>
                          </span>
                          <input
                            id="profile-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="98765 43210"
                          />
                        </div>
                      </div>

                      {/* Date of Birth (Optional) */}
                      <div className="form-field-group">
                        <label htmlFor="profile-dob">Date of Birth (Optional)</label>
                        <input
                          id="profile-dob"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                      </div>

                      {/* Gender (Optional) */}
                      <div className="form-field-group">
                        <label htmlFor="profile-gender">Gender (Optional)</label>
                        <select
                          id="profile-gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions-row">
                      <button
                        type="submit"
                        className="button save-changes-btn"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Addresses */}
              {activeTab === 'addresses' && (
                <div className="profile-card">
                  <div className="card-head-simple">
                    <h2>Saved Addresses</h2>
                    <p>Manage your delivery destinations for faster checkout.</p>
                  </div>

                  <div className="address-cards-stack">
                    <div className="address-item-card active-address">
                      <div className="address-badge-row">
                        <span className="default-pill">Default</span>
                        <strong>Home</strong>
                      </div>
                      <p className="address-body">
                        24, Olive Street, 3rd Floor, Salt Lake Sector 1, Kolkata, West Bengal - 700064
                      </p>
                      <small className="address-phone">+91 {phone}</small>
                    </div>

                    <div className="address-item-card">
                      <div className="address-badge-row">
                        <strong>Work / Office</strong>
                      </div>
                      <p className="address-body">
                        Tech Park Block B, Plot 14, New Town, Kolkata - 700156
                      </p>
                      <small className="address-phone">+91 {phone}</small>
                    </div>
                  </div>

                  <div className="tab-unavailable-note">
                    <Info size={15} />
                    <span>Address management persistence is currently disabled in this preview.</span>
                  </div>
                </div>
              )}

              {/* Tab 3: Payment Methods */}
              {activeTab === 'payment' && (
                <div className="profile-card">
                  <div className="card-head-simple">
                    <h2>Payment Methods</h2>
                    <p>Secure payment methods for quick checkout.</p>
                  </div>

                  <div className="payment-cards-stack">
                    <div className="payment-item-card">
                      <div className="payment-icon-wrap">
                        <CreditCard size={20} className="text-brand" />
                      </div>
                      <div>
                        <strong>HDFC Bank Debit Card</strong>
                        <small>•••• •••• •••• 4242 &nbsp;·&nbsp; Expires 09/28</small>
                      </div>
                      <span className="default-pill">Default</span>
                    </div>

                    <div className="payment-item-card">
                      <div className="payment-icon-wrap">
                        <Sparkles size={20} className="text-brand" />
                      </div>
                      <div>
                        <strong>UPI ID</strong>
                        <small>customer@oksbi</small>
                      </div>
                    </div>
                  </div>

                  <div className="tab-unavailable-note">
                    <Info size={15} />
                    <span>Payment method persistence is disabled in this preview.</span>
                  </div>
                </div>
              )}

              {/* Tab 4: Preferences */}
              {activeTab === 'preferences' && (
                <div className="profile-card">
                  <div className="card-head-simple">
                    <h2>Account Preferences</h2>
                    <p>Personalize your PizzaDelight experience.</p>
                  </div>

                  <div className="preferences-list">
                    <label className="pref-toggle-row">
                      <div>
                        <strong>SMS Order Updates</strong>
                        <small>Receive real-time delivery status via text message.</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsNotifs}
                        onChange={(e) => {
                          setSmsNotifs(e.target.checked);
                          triggerNotice('Preference updated for this session.');
                        }}
                      />
                    </label>

                    <label className="pref-toggle-row">
                      <div>
                        <strong>Promotional Emails & Deals</strong>
                        <small>Exclusive discounts and weekend chef specials.</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailOffers}
                        onChange={(e) => {
                          setEmailOffers(e.target.checked);
                          triggerNotice('Preference updated for this session.');
                        }}
                      />
                    </label>

                    <label className="pref-toggle-row">
                      <div>
                        <strong>Vegetarian Friendly Recommendations</strong>
                        <small>Prioritize vegetarian pizzas and sides in your feed.</small>
                      </div>
                      <input
                        type="checkbox"
                        checked={vegOnly}
                        onChange={(e) => {
                          setVegOnly(e.target.checked);
                          triggerNotice('Preference updated for this session.');
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 5: Security */}
              {activeTab === 'security' && (
                <div className="profile-card">
                  <div className="card-head-simple">
                    <h2>Account Security</h2>
                    <p>Manage your password and security credentials.</p>
                  </div>

                  <div className="security-section-body">
                    <div className="security-item-row">
                      <div>
                        <strong>Password</strong>
                        <small>Last changed 30 days ago</small>
                      </div>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => onNavigate('/forgot-password')}
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="security-item-row">
                      <div>
                        <strong>Two-Factor Authentication</strong>
                        <small>Enhance account protection during login.</small>
                      </div>
                      <span className="status-pill-muted">Coming Soon</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Account Summary & Quick Actions */}
            <div className="profile-side-column">
              {/* Account Summary Card */}
              <div className="profile-card account-summary-card">
                <h2>Account Summary</h2>
                <div className="summary-metrics-grid">
                  {/* Total Orders */}
                  <div className="summary-metric-box">
                    <div className="metric-icon-wrap red-wrap">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="metric-text-wrap">
                      <strong>24</strong>
                      <small>Total Orders</small>
                    </div>
                  </div>

                  {/* Favorites */}
                  <div className="summary-metric-box">
                    <div className="metric-icon-wrap red-wrap">
                      <Heart size={18} />
                    </div>
                    <div className="metric-text-wrap">
                      <strong>12</strong>
                      <small>Favorites</small>
                    </div>
                  </div>

                  {/* Premium Member */}
                  <div className="summary-metric-box">
                    <div className="metric-icon-wrap gold-wrap">
                      <Crown size={18} />
                    </div>
                    <div className="metric-text-wrap">
                      <strong>Premium</strong>
                      <small>Member</small>
                    </div>
                  </div>

                  {/* Average Rating */}
                  <div className="summary-metric-box">
                    <div className="metric-icon-wrap amber-wrap">
                      <Star size={18} />
                    </div>
                    <div className="metric-text-wrap">
                      <strong>4.8</strong>
                      <small>Average Rating</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="profile-card quick-actions-card">
                <h2>Quick Actions</h2>
                <div className="quick-actions-list">
                  <button
                    type="button"
                    className="quick-action-row"
                    onClick={() => onNavigate('/forgot-password')}
                  >
                    <div className="action-row-left">
                      <KeyRound size={16} className="text-brand" />
                      <span>Change Password</span>
                    </div>
                    <ChevronRight size={15} className="action-chevron" />
                  </button>

                  <button
                    type="button"
                    className="quick-action-row"
                    onClick={() => triggerNotice('Notification settings are unavailable in this preview.')}
                  >
                    <div className="action-row-left">
                      <Bell size={16} className="text-brand" />
                      <span>Notification Settings</span>
                    </div>
                    <ChevronRight size={15} className="action-chevron" />
                  </button>

                  <button
                    type="button"
                    className="quick-action-row danger-action"
                    onClick={() => triggerNotice('Account deletion is currently unavailable in this preview.')}
                  >
                    <div className="action-row-left">
                      <Trash2 size={16} className="text-red" />
                      <span>Delete Account</span>
                    </div>
                    <ChevronRight size={15} className="action-chevron" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Information Banners */}
          <div className="profile-bottom-banners-grid">
            {/* Banner 1: Good Food, Better You */}
            <div className="bottom-banner-green">
              <div className="green-icon-wrap">
                <Leaf size={20} className="text-emerald" />
              </div>
              <div className="green-banner-copy">
                <strong>Good Food, Better You</strong>
                <p>
                  Manage your preferences to get personalized recommendations and a better
                  pizza experience.
                </p>
              </div>
              <div className="green-banner-img-wrap">
                <img
                  src="https://images.pexels.com/photos/5640034/pexels-photo-5640034.jpeg?auto=compress&cs=tinysrgb&h=160&w=160"
                  alt="Delicious artisan pizza"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Banner 2: Need Help? */}
            <div className="bottom-banner-help">
              <div className="help-icon-wrap">
                <Mail size={20} className="text-brand" />
              </div>
              <div className="help-banner-copy">
                <strong>Need Help?</strong>
                <p>Our support team is here for you 24/7.</p>
              </div>
              <button
                type="button"
                className="button button-outline help-cta-btn"
                onClick={() => triggerNotice('Reach our customer support at 1800 123 456 or help@pizzadelight.com')}
              >
                Contact Support
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
