
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import "./Pricing.css";

function Pricing() {
  const { currentUser, loading: authLoading } = useAuth();

  const [plan, setPlan] = useState("free");
  const [checkingPlan, setCheckingPlan] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Read the current subscription from Firestore
  useEffect(() => {
    let active = true;

    async function loadPlan() {
      if (!currentUser) {
        setPlan("free");
        return;
      }

      setCheckingPlan(true);
      setError("");

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          throw new Error("Your user profile was not found.");
        }

        if (active) {
          setPlan(snapshot.data().plan || "free");
        }
      } catch (err) {
        if (active) {
          setError("Could not load your subscription. Please refresh and try again.");
          console.error("Plan loading error:", err);
        }
      } finally {
        if (active) setCheckingPlan(false);
      }
    }

    loadPlan();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleUpgradeClick = () => {
    setMessage("");
    setError("");

    if (!currentUser) {
      setMessage("Please log in before upgrading your plan.");
      return;
    }

    if (plan === "paid") {
      setMessage("You already have the Paid plan.");
      return;
    }

    if (checkingPlan || authLoading) {
      setMessage("Please wait while we check your account.");
      return;
    }

    setName(currentUser.displayName || "");
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentUser) {
      setError("Please log in again before upgrading.");
      return;
    }

    const digits = cardNumber.replace(/\s/g, "");
    const expiryMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

    if (name.trim().length < 2) {
      setError("Please enter the cardholder's name.");
      return;
    }

    // Demo validation only; this is not real payment processing.
    if (!/^\d{16}$/.test(digits)) {
      setError("Enter a 16-digit test card number.");
      return;
    }

    if (!expiryMatch) {
      setError("Enter the expiry in MM/YY format.");
      return;
    }

    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    const now = new Date();

    if (
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1)
    ) {
      setError("This card has expired.");
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setError("Enter a valid 3- or 4-digit test CVV.");
      return;
    }

    setSaving(true);

    try {
      const userRef = doc(db, "users", currentUser.uid);

      // Recheck the stored plan before updating it.
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        throw new Error("Your user profile was not found.");
      }

      if (snapshot.data().plan === "paid") {
        setPlan("paid");
        setModalOpen(false);
        setMessage("Your account is already on the Paid plan.");
        return;
      }

      await updateDoc(userRef, {
        plan: "paid",
        planUpdatedAt: new Date().toISOString(),
      });

      setPlan("paid");
      setModalOpen(false);
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setMessage("Your account has been upgraded to the Paid plan!");
    } catch (err) {
      console.error("Upgrade error:", err);
      setError("Upgrade failed. Check your Firestore permissions and try again.");
    } finally {
      setSaving(false);
    }
  };

  const freeFeatures = [
    "Create and publish posts",
    "Access free articles and tutorials",
    "Basic profile",
    "Standard community access",
    "Up to 5 posts per month",
  ];

  const paidFeatures = [
    "Everything in Free",
    "Access to premium posts",
    "Unlimited posts",
    "Larger image uploads",
    "Priority content discovery",
    "Enhanced profile features",
  ];

  return (
    <main className="pricing-page">
      <section className="pricing-heading">
        <p className="pricing-eyebrow">DEV@DEAKIN MEMBERSHIP</p>
        <h1>Choose your plan</h1>
        <p>Find the right plan for your learning, sharing and community needs.</p>

        {currentUser && (
          <p className="current-plan">
            Your current plan: <strong>{plan.toUpperCase()}</strong>
          </p>
        )}
      </section>

      <section className="pricing-grid">
        <article className="pricing-card">
          <h2>Free</h2>
          <p className="pricing-description">Everything you need to get started.</p>
          <p className="pricing-price">$0 <span>/ forever</span></p>

          <ul>
            {freeFeatures.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>

          <button type="button" className="pricing-button pricing-button-secondary" disabled>
            Free plan
          </button>
        </article>

        <article className="pricing-card pricing-card-featured">
          <span className="pricing-badge">RECOMMENDED</span>
          <h2>Paid</h2>
          <p className="pricing-description">More room to create, learn and share.</p>
          <p className="pricing-price">$9.99 <span>/ month</span></p>

          <ul>
            {paidFeatures.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>

          <button
            type="button"
            className="pricing-button pricing-button-primary"
            onClick={handleUpgradeClick}
            disabled={authLoading || checkingPlan || saving}
          >
            {checkingPlan
              ? "Checking plan..."
              : plan === "paid"
                ? "Already upgraded"
                : currentUser
                  ? "Upgrade plan"
                  : "Log in to upgrade"}
          </button>
        </article>
      </section>

      {message && <p className="pricing-message" role="status">{message}</p>}
      {error && !modalOpen && <p className="pricing-error" role="alert">{error}</p>}

      <p className="pricing-note">
        Subscription features and payment validation are for demonstration purposes.
        No payment is processed.
      </p>

      {modalOpen && (
        <div
          className="upgrade-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <section
            className="upgrade-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            <button
              type="button"
              className="upgrade-close"
              onClick={() => {
                setModalOpen(false);
                setError("");
              }}
              disabled={saving}
              aria-label="Close upgrade form"
            >
              ×
            </button>

            <h2 id="upgrade-title">Upgrade to Paid</h2>
            <p>Demo checkout · $9.99/month</p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="card-name">Cardholder name</label>
              <input
                id="card-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
              />

              <label htmlFor="card-number">Test card number</label>
              <input
                id="card-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                inputMode="numeric"
                placeholder="16 digits"
                autoComplete="off"
                maxLength={19}
                required
              />

              <div className="upgrade-card-row">
                <div>
                  <label htmlFor="card-expiry">Expiry (MM/YY)</label>
                  <input
                    id="card-expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    autoComplete="off"
                    maxLength={5}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="card-cvv">Test CVV</label>
                  <input
                    id="card-cvv"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <p className="upgrade-demo-note">
                Use fictional test details only. Do not enter real card information.
              </p>

              {error && <p className="pricing-error" role="alert">{error}</p>}

              <button
                type="submit"
                className="pricing-button pricing-button-primary"
                disabled={saving}
              >
                {saving ? "Updating plan..." : "Confirm demo upgrade"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Pricing;
