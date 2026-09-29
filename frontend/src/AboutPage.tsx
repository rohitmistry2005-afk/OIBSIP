import {
  ArrowRight,
  Bike,
  ChefHat,
  CookingPot,
  Flame,
  Heart,
  Leaf,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Utensils,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const scrollToStory = () => {
    const el = document.getElementById('our-story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="about-page">
      {/* 1. HERO SECTION */}
      <section className="about-hero">
        <div className="about-hero-copy">
          <p className="eyebrow">OUR STORY, OUR PASSION</p>
          <h1>
            Good Pizza.<br />
            <em>Happier People.</em>
          </h1>
          <p className="about-hero-description">
            At PizzaDelight, we believe pizza is more than just food — it's a way to bring people
            together. Crafted with the freshest ingredients, delivered hot, and made with love, we
            turn every meal into a moment of happiness.
          </p>
          <div className="about-hero-actions">
            <button type="button" className="button" onClick={scrollToStory}>
              Explore Our Journey <ArrowRight size={16} />
            </button>
          </div>
          <div className="about-stats-row">
            <div className="about-stat">
              <strong>50K+</strong>
              <span>Happy Customers</span>
            </div>
            <div className="about-stat-divider" aria-hidden="true" />
            <div className="about-stat">
              <strong>100+</strong>
              <span>Pizza Combinations</span>
            </div>
            <div className="about-stat-divider" aria-hidden="true" />
            <div className="about-stat">
              <strong>4.8★</strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </div>

        <div className="about-hero-visual">
          <img
            src="/images/about/hero-friends.jpg"
            alt="Friends happily enjoying PizzaDelight pizza together"
            loading="eager"
          />
          <div className="about-hero-note">
            <p className="about-hand-script">Pizza brings people together ♡</p>
          </div>
        </div>
      </section>

      {/* 2. OUR STORY SECTION */}
      <section className="about-story-section" id="our-story">
        <div className="about-container about-story-grid">
          <div className="about-story-copy">
            <p className="eyebrow">OUR STORY</p>
            <h2>
              From a Simple Idea<br />
              to a <em>Shared Happiness.</em>
            </h2>
            <div className="about-story-paragraphs">
              <p>
                PizzaDelight started with a simple idea — to serve delicious, high-quality pizzas made
                from fresh ingredients, and to make them accessible to everyone. What began as a
                passion for great food has grown into a community of pizza lovers who trust us for
                consistent taste, quality, and service.
              </p>
              <p>
                Today, we continue to stay true to our roots — real ingredients, handcrafted recipes,
                and a customer-first approach — because your happiness is what drives us.
              </p>
            </div>
            <button
              type="button"
              className="button about-story-btn"
              onClick={() => onNavigate('/menu')}
            >
              Our Menu <ArrowRight size={16} />
            </button>
          </div>

          <div className="about-story-media">
            <div className="about-collage-wrap">
              <div className="about-collage-main">
                <img
                  src="/images/about/chef-dough.jpg"
                  alt="Artisan pizza chef dusting flour onto fresh dough"
                  loading="eager"
                />
              </div>
              <div className="about-collage-thumb top-thumb">
                <img
                  src="/images/about/fresh-tomatoes.jpg"
                  alt="Vibrant fresh vine tomatoes"
                  loading="eager"
                />
              </div>
              <div className="about-collage-thumb bottom-thumb">
                <img
                  src="/images/about/fresh-mozzarella.jpg"
                  alt="Fresh artisan mozzarella balls with basil"
                  loading="eager"
                />
              </div>
              <div className="about-collage-script">
                <p>
                  Fresh Ingredients.<br />
                  Better Pizzas.<br />
                  Happier People. ♡
                </p>
              </div>
              {/* Decorative subtle botanical line art */}
              <svg
                className="about-leaf-art"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M10,80 Q30,20 80,10 Q60,60 10,80 Z M30,48 Q55,42 75,20"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="2 3"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY PIZZADELIGHT SECTION */}
      <section className="about-why-section">
        <div className="about-container">
          <div className="about-section-header">
            <p className="eyebrow">WHY PIZZADELIGHT</p>
            <h2>
              More Than <em>Just Pizza</em>
            </h2>
          </div>
          <div className="about-why-grid">
            <article className="about-why-card">
              <div className="about-why-icon-wrap" aria-hidden="true">
                <Leaf size={22} />
              </div>
              <h3>Fresh Ingredients</h3>
              <p>
                We source the finest, freshest ingredients to bring out real flavours in every bite.
              </p>
            </article>

            <article className="about-why-card">
              <div className="about-why-icon-wrap" aria-hidden="true">
                <ChefHat size={22} />
              </div>
              <h3>Handcrafted Pizzas</h3>
              <p>
                Every pizza is made with care by our chefs, combining tradition and creativity.
              </p>
            </article>

            <article className="about-why-card">
              <div className="about-why-icon-wrap" aria-hidden="true">
                <Truck size={22} />
              </div>
              <h3>Fast Delivery</h3>
              <p>
                Hot and fresh pizzas delivered to your doorstep, on time, every time.
              </p>
            </article>

            <article className="about-why-card">
              <div className="about-why-icon-wrap" aria-hidden="true">
                <ShieldCheck size={22} />
              </div>
              <h3>Secure Payments</h3>
              <p>
                Your transactions are safe and secure with trusted payment partners.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 4. HOW WE MAKE IT SECTION */}
      <section className="about-process-section">
        <div className="about-container">
          <div className="about-process-header">
            <p className="eyebrow">HOW WE MAKE IT</p>
            <h2>
              From Fresh Ingredients<br />
              to <em>Your Doorstep</em>
            </h2>
            <p className="about-process-subtitle">
              Every PizzaDelight pizza goes through a careful process to ensure you get the best
              taste, quality and experience.
            </p>
          </div>

          <div className="about-timeline-wrap">
            <div className="about-timeline-connector" aria-hidden="true" />
            <div className="about-timeline-steps">
              {/* Step 1 */}
              <div className="about-step-item">
                <div className="about-step-node">
                  <span className="about-step-num">1</span>
                </div>
                <div className="about-step-icon" aria-hidden="true">
                  <Salad size={26} />
                </div>
                <h4>Select Fresh Ingredients</h4>
                <p>We source high-quality, fresh ingredients daily.</p>
              </div>

              {/* Step 2 */}
              <div className="about-step-item">
                <div className="about-step-node">
                  <span className="about-step-num">2</span>
                </div>
                <div className="about-step-icon" aria-hidden="true">
                  <CookingPot size={26} />
                </div>
                <h4>Prepare with Care</h4>
                <p>Our chefs handcraft each pizza with the perfect blend of flavours.</p>
              </div>

              {/* Step 3 */}
              <div className="about-step-item">
                <div className="about-step-node">
                  <span className="about-step-num">3</span>
                </div>
                <div className="about-step-icon" aria-hidden="true">
                  <Flame size={26} />
                </div>
                <h4>Bake to Perfection</h4>
                <p>Pizzas are baked at the right temperature for that perfect taste.</p>
              </div>

              {/* Step 4 */}
              <div className="about-step-item">
                <div className="about-step-node">
                  <span className="about-step-num">4</span>
                </div>
                <div className="about-step-icon" aria-hidden="true">
                  <Bike size={26} />
                </div>
                <h4>Deliver with Love</h4>
                <p>Hot and fresh, straight to your doorstep.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Pizza slice watermark */}
        <div className="about-process-watermark" aria-hidden="true">
          <svg viewBox="0 0 160 160" fill="none" stroke="currentColor">
            <path
              d="M20,20 Q80,10 140,20 L80,145 Z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="65" cy="55" r="9" strokeWidth="1.5" />
            <circle cx="95" cy="65" r="8" strokeWidth="1.5" />
            <circle cx="80" cy="95" r="7" strokeWidth="1.5" />
          </svg>
        </div>
      </section>

      {/* 5. OUR PROMISE SECTION */}
      <section className="about-promise-section">
        <div className="about-container about-promise-grid">
          <div className="about-promise-media">
            <img
              src="/images/about/promise-pizza.jpg"
              alt="Freshly baked gourmet pizza on wooden board"
              loading="eager"
            />
          </div>
          <div className="about-promise-copy">
            <p className="eyebrow">OUR PROMISE</p>
            <h2>
              Great Food.<br />
              <em>Greater Moments.</em>
            </h2>
            <p className="about-promise-description">
              We are committed to delivering not just great pizza, but great experiences. Whether
              it's a quick bite, a family dinner, or a celebration with friends, PizzaDelight is here
              to make every moment special.
            </p>
            <div className="about-values-row">
              <div className="about-value-item">
                <div className="about-value-icon" aria-hidden="true">
                  <Heart size={20} />
                </div>
                <strong>Quality Always</strong>
              </div>
              <div className="about-value-item">
                <div className="about-value-icon" aria-hidden="true">
                  <Users size={20} />
                </div>
                <strong>Customers First</strong>
              </div>
              <div className="about-value-item">
                <div className="about-value-icon" aria-hidden="true">
                  <Leaf size={20} />
                </div>
                <strong>Sustainable Choices</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="about-cta-section">
        <div className="about-container">
          <div className="about-cta-card">
            <div className="about-cta-copy">
              <p className="eyebrow">Ready for a Delicious Experience?</p>
              <h2>
                <em>Build Your Own Pizza</em> Today!
              </h2>
              <p>
                Choose your favorite base, sauces, cheese and toppings to create a pizza that's
                uniquely yours.
              </p>
            </div>
            <div className="about-cta-actions">
              <button
                type="button"
                className="button about-cta-btn-primary"
                onClick={() => onNavigate('/builder')}
              >
                <Sparkles size={16} /> Build Your Own <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="button button-outline about-cta-btn-secondary"
                onClick={() => onNavigate('/menu')}
              >
                <Utensils size={15} /> Explore the Menu
              </button>
            </div>
            <div className="about-cta-garnish" aria-hidden="true">
              <img
                src="/images/about/cta-garnish.png"
                alt=""
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
