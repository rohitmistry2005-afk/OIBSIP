import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Pencil,
  Flame,
  Info,
  Sparkles,
  ArrowRight,
  Truck,
} from 'lucide-react';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
  available: boolean;
};

interface PizzaDetailsProps {
  product?: Product;
  allProducts: Product[];
  onAdd: (product: Product) => void;
  onNavigate: (path: string) => void;
}

// Supplementary visual assets for gallery and ingredient presentation
const INGREDIENT_IMAGES = {
  sauce:
    'https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  cheese:
    'https://images.pexels.com/photos/4109998/pexels-photo-4109998.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  basil:
    'https://images.pexels.com/photos/1087727/pexels-photo-1087727.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  tomatoes:
    'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
  oil:
    'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&h=200&w=200',
  herbs:
    'https://images.pexels.com/photos/277253/pexels-photo-277253.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
};

const INGREDIENTS_LIST = [
  { name: 'Tomato Sauce', image: INGREDIENT_IMAGES.sauce },
  { name: 'Mozzarella Cheese', image: INGREDIENT_IMAGES.cheese },
  { name: 'Fresh Basil', image: INGREDIENT_IMAGES.basil },
  { name: 'Cherry Tomatoes', image: INGREDIENT_IMAGES.tomatoes },
  { name: 'Olive Oil', image: INGREDIENT_IMAGES.oil },
  { name: 'Italian Herbs', image: INGREDIENT_IMAGES.herbs },
];

export function PizzaDetails({
  product,
  allProducts,
  onAdd,
  onNavigate,
}: PizzaDetailsProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'7"' | '10"' | '12"'>('10"');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'nutrition' | 'reviews'>('ingredients');
  const [addedToast, setAddedToast] = useState(false);

  // If no product matches the requested ID, show a clean not-found state
  if (!product) {
    return (
      <main className="page-shell pizza-not-found-page">
        <div className="pizza-not-found-card">
          <div className="not-found-icon-wrap">
            <Sparkles size={36} className="text-brand" />
          </div>
          <h2>Pizza Not Found</h2>
          <p>We couldn&apos;t find the pizza you were looking for. It might have been updated or moved.</p>
          <button
            type="button"
            className="button"
            onClick={() => onNavigate('/menu')}
          >
            <span>Explore Full Menu</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  // Build the 5-item gallery array around the product's primary image
  const galleryImages = [
    product.image,
    'https://images.pexels.com/photos/34407073/pexels-photo-34407073.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/5640034/pexels-photo-5640034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/12096782/pexels-photo-12096782.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/35428716/pexels-photo-35428716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAdd(product);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  // Related products from existing products array
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <main className="pizza-details-page page-shell">
      {/* 1. Breadcrumb */}
      <nav className="pizza-breadcrumb" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="pizza-crumb-item"
        >
          <Home size={14} aria-hidden="true" />
          <span>Home</span>
        </button>
        <ChevronRight size={13} className="pizza-crumb-sep" aria-hidden="true" />
        <button
          type="button"
          onClick={() => onNavigate('/menu')}
          className="pizza-crumb-item"
        >
          Menu
        </button>
        <ChevronRight size={13} className="pizza-crumb-sep" aria-hidden="true" />
        <button
          type="button"
          onClick={() => onNavigate('/menu')}
          className="pizza-crumb-item"
        >
          Classic Pizzas
        </button>
        <ChevronRight size={13} className="pizza-crumb-sep" aria-hidden="true" />
        <span className="pizza-crumb-current" aria-current="page">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Section (2 Columns) */}
      <div className="pizza-detail-layout">
        {/* Left Column: Image Gallery */}
        <div className="pizza-gallery">
          <div className="pizza-main-image-wrap">
            <img
              src={galleryImages[activeImageIndex]}
              alt={`${product.name} view ${activeImageIndex + 1}`}
              className="pizza-main-image"
            />
            {/* Bestseller / Product Badge */}
            <span className="pizza-bestseller-badge">
              <Flame size={14} className="badge-flame-icon" aria-hidden="true" />
              <span>{product.badge || 'Bestseller'}</span>
            </span>

            {/* Gallery Arrows */}
            <button
              type="button"
              className="gallery-arrow gallery-prev"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-next"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Thumbnails Row */}
          <div className="pizza-thumbs-row" role="tablist" aria-label="Product image thumbnails">
            {galleryImages.map((thumbUrl, idx) => (
              <button
                key={idx}
                type="button"
                className={`pizza-thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-selected={activeImageIndex === idx}
                role="tab"
              >
                <img src={thumbUrl} alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Product Information & Controls */}
        <div className="pizza-info">
          <div className="pizza-info-header">
            <div>
              <p className="eyebrow">CLASSIC PIZZA</p>
              <h1 className="pizza-name">{product.name}</h1>
            </div>
            {/* Wishlist Button (Local presentation state) */}
            <button
              type="button"
              className={`pizza-wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                size={18}
                fill={isWishlisted ? 'var(--red)' : 'none'}
                className={isWishlisted ? 'text-brand' : ''}
              />
              <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* Rating Display (Presentation) */}
          <div className="pizza-rating-row">
            <div className="pizza-rating-stars" aria-label="4.8 out of 5 stars">
              {'★★★★★'}
            </div>
            <strong className="pizza-rating-val">4.8</strong>
            <span className="pizza-rating-count">(1.2K reviews)</span>
          </div>

          {/* Description */}
          <p className="pizza-description">
            {product.description ||
              'A timeless classic topped with rich tomato sauce, creamy mozzarella cheese, fresh basil leaves, and a sprinkle of herbs. Simple ingredients, extraordinary taste.'}
          </p>

          {/* Price & Stock Availability Row */}
          <div className="pizza-price-stock-row">
            <div className="pizza-price-box">
              <strong className="pizza-current-price">₹{product.price}</strong>
              <span className="pizza-price-subnote">
                ({selectedSize === '10"' ? 'Regular 10" size' : `${selectedSize} size`})
              </span>
            </div>
            <div className="pizza-stock-box">
              {product.available ? (
                <>
                  <span className="stock-dot in-stock" aria-hidden="true" />
                  <div>
                    <strong className="stock-title">In Stock</strong>
                    <small className="stock-subtitle">Ready to order</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="stock-dot out-of-stock" aria-hidden="true" />
                  <div>
                    <strong className="stock-title sold-out">Unavailable</strong>
                    <small className="stock-subtitle">Sold out today</small>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Size Selector (Local UI state, preserving base product price) */}
          <div className="pizza-size-section">
            <label className="pizza-control-label">Select Size</label>
            <div className="pizza-sizes-grid" role="radiogroup" aria-label="Pizza size options">
              {(['7"', '10"', '12"'] as const).map((size) => {
                const isSelected = selectedSize === size;
                const isPopular = size === '10"';
                return (
                  <button
                    key={size}
                    type="button"
                    className={`pizza-size-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    {isPopular && <span className="pizza-popular-pill">Popular</span>}
                    <strong className="size-label">{size}</strong>
                    <span className="size-price">₹{product.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & CTA Actions */}
          <div className="pizza-actions-wrap">
            {/* Quantity Stepper */}
            <div className="pizza-qty-stepper">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span aria-label={`Quantity ${quantity}`}>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Primary CTA: Add to Cart */}
            <button
              type="button"
              className="button pizza-primary-add-btn"
              onClick={handleAddToCart}
              disabled={!product.available}
            >
              <ShoppingBag size={18} aria-hidden="true" />
              <span>{addedToast ? 'Added to Cart!' : 'Add to Cart'}</span>
            </button>

            {/* Secondary CTA: Customize This Pizza (Existing Builder) */}
            <button
              type="button"
              className="button button-outline pizza-customize-btn"
              onClick={() => onNavigate('/builder')}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>Customize This Pizza</span>
            </button>
          </div>

          {/* Trust Row */}
          <div className="pizza-trust-row">
            <div className="trust-item">
              <Leaf size={22} className="text-brand" aria-hidden="true" />
              <div>
                <strong>Fresh Ingredients</strong>
                <small>Always fresh</small>
              </div>
            </div>
            <div className="trust-item">
              <ShieldCheck size={22} className="text-brand" aria-hidden="true" />
              <div>
                <strong>Quality Guarantee</strong>
                <small>Best in town</small>
              </div>
            </div>
            <div className="trust-item">
              <Truck size={22} className="text-brand" aria-hidden="true" />
              <div>
                <strong>Fast Delivery</strong>
                <small>On time, always</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lower Product Information Section (Tabs) */}
      <div className="pizza-tabs-section">
        {/* Tab Headers */}
        <div className="pizza-tabs-bar" role="tablist">
          <button
            type="button"
            className={`pizza-tab-trigger ${activeTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredients')}
            role="tab"
            aria-selected={activeTab === 'ingredients'}
          >
            Ingredients
          </button>
          <button
            type="button"
            className={`pizza-tab-trigger ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
            role="tab"
            aria-selected={activeTab === 'nutrition'}
          >
            Nutritional Info
          </button>
          <button
            type="button"
            className={`pizza-tab-trigger ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
            role="tab"
            aria-selected={activeTab === 'reviews'}
          >
            Reviews (1.2K)
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="pizza-tab-content-panel">
          {activeTab === 'ingredients' && (
            <div className="ingredients-panel-layout">
              <div className="ingredients-left">
                <div className="ingredients-head">
                  <h2>Fresh Ingredients</h2>
                  <p>Made with the finest ingredients</p>
                </div>
                <div className="ingredients-grid">
                  {INGREDIENTS_LIST.map((item) => (
                    <div key={item.name} className="ingredient-circle-item">
                      <div className="ingredient-img-wrap">
                        <img src={item.image} alt={item.name} loading="lazy" />
                      </div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Callout Card */}
              <div className="ingredients-callout-card">
                <div className="callout-image-wrap">
                  <img
                    src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=160&w=160"
                    alt="Vine-ripened tomatoes"
                  />
                </div>
                <div className="callout-text">
                  <h3>Real Ingredients. Real Flavours.</h3>
                  <p>
                    We use 100% natural ingredients, sourced from trusted local farmers to give you
                    the authentic Italian taste.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="nutrition-panel-empty">
              <div className="info-icon-badge" aria-hidden="true">
                <Info size={28} />
              </div>
              <h3>Nutritional Information</h3>
              <p>
                Nutritional information is currently unavailable for this item. Please consult our
                kitchen team for allergen or dietary questions.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-panel-presentation">
              <div className="review-summary-box">
                <div className="review-score-big">4.8</div>
                <div className="pizza-rating-stars">{'★★★★★'}</div>
                <p>Based on 1,248 community ratings</p>
              </div>
              <p className="presentation-note">
                Customer ratings are updated periodically. Review submission is currently disabled
                in this preview.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products Section */}
      <section className="related-pizzas-section" aria-labelledby="related-heading">
        <div className="section-heading">
          <h2 id="related-heading">You Might Also Like</h2>
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate('/menu')}
          >
            <span>View All Pizzas</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="related-grid">
          {relatedProducts.map((p) => (
            <article key={p.id} className="related-card">
              <div
                className="related-image-wrap"
                onClick={() => onNavigate(`/pizza/${p.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`View ${p.name} details`}
              >
                <img src={p.image} alt={p.name} loading="lazy" />
              </div>
              <div className="related-info">
                <h3
                  onClick={() => onNavigate(`/pizza/${p.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {p.name}
                </h3>
                <strong>₹{p.price}</strong>
              </div>
              <button
                type="button"
                className="add-button related-add-btn"
                onClick={() => onAdd(p)}
                aria-label={`Add ${p.name} to cart`}
              >
                <Plus size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
