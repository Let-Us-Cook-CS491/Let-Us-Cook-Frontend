import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { loadProfileSnapshot, saveProfileSnapshot } from '../utils/profileStorage';
import { createCheckoutSession, getCurrentSubscription } from '../services/billingService';

const ADDRESS_KEY = 'billingAddress';
const CARDS_KEY = 'billingCardsMeta';

const EMPTY_ADDRESS = {
  full_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'USA',
  phone: '',
};

const EMPTY_CARD_FORM = {
  card_number: '',
  cardholder_name: '',
  exp_month: '',
  exp_year: '',
};

const detectCardBrand = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
};

const formatCardNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 19);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

const expiryYears = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() + i));

const TIERS = [
  {
    code: 'free',
    name: 'Free',
    price: '$0/mo',
    features: ['Core meal planning', 'Basic fridge tracking', 'Standard grocery list'],
  },
  {
    code: 'premium_monthly',
    name: 'Premium',
    price: '$9.99/mo',
    features: ['Advanced planning insights', 'Priority recommendations', 'Higher personalization'],
  },
  {
    code: 'ultra_monthly',
    name: 'Ultra',
    price: '$19.99/mo',
    features: ['Everything in Premium', 'Top-tier AI meal suggestions', 'Best subscription tier support'],
  },
];

const TIER_RANK = {
  free: 0,
  premium_monthly: 1,
  ultra_monthly: 2,
};

const normalizePlanCode = (planCode) => {
  const normalized = String(planCode || 'free').toLowerCase();
  if (normalized === 'premium') return 'premium_monthly';
  if (normalized === 'ultra') return 'ultra_monthly';
  return normalized;
};

const apiErrorMessage = (err) => {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.error) return err.error;
  return 'Something went wrong.';
};

const ProfileBilling = () => {
  const location = useLocation();
  const [billingAddress, setBillingAddress] = useState(
    () => loadProfileSnapshot(ADDRESS_KEY) || null,
  );
  const [cards, setCards] = useState(() => {
    const rows = loadProfileSnapshot(CARDS_KEY);
    return Array.isArray(rows) ? rows : [];
  });
  const [editingAddress, setEditingAddress] = useState(() => !loadProfileSnapshot(ADDRESS_KEY));
  const [addressForm, setAddressForm] = useState(
    () => loadProfileSnapshot(ADDRESS_KEY) || EMPTY_ADDRESS,
  );
  const [addingCard, setAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState(EMPTY_CARD_FORM);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    [],
  );

  const setMessage = (next) => setStatus(next);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!localStorage.getItem('accessToken')) return;
      setLoadingSub(true);
      try {
        const res = await getCurrentSubscription();
        if (!cancelled && res?.status === 'OK') {
          setSubscription(res.data || null);
        }
      } catch {
        // keep billing UI usable even if subscription fetch fails
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upgrade') === '1') {
      setUpgradeOpen(true);
    }
  }, [location.search]);

  const onAddressChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
    setMessage({ error: '', success: '' });
  };

  const saveAddress = (event) => {
    event.preventDefault();
    if (
      !addressForm.full_name.trim() ||
      !addressForm.address_line1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postal_code.trim() ||
      !addressForm.country.trim()
    ) {
      setMessage({ error: 'Please fill all required address fields.', success: '' });
      return;
    }

    const next = {
      ...addressForm,
      full_name: addressForm.full_name.trim(),
      address_line1: addressForm.address_line1.trim(),
      address_line2: addressForm.address_line2.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postal_code: addressForm.postal_code.trim(),
      country: addressForm.country.trim(),
      phone: addressForm.phone.trim(),
    };

    saveProfileSnapshot(ADDRESS_KEY, next);
    setBillingAddress(next);
    setEditingAddress(false);
    setMessage({ error: '', success: 'Billing address saved.' });
  };

  const deleteAddress = () => {
    setBillingAddress(null);
    setAddressForm(EMPTY_ADDRESS);
    saveProfileSnapshot(ADDRESS_KEY, null);
    setMessage({ error: '', success: 'Billing address removed.' });
    setEditingAddress(true);
  };

  const saveCard = (event) => {
    event.preventDefault();
    const digits = cardForm.card_number.replace(/\D/g, '');
    if (!billingAddress) {
      setMessage({ error: 'Save billing address first.', success: '' });
      return;
    }
    if (digits.length < 13 || !cardForm.exp_month || !cardForm.exp_year) {
      setMessage({ error: 'Enter a valid card number and expiry.', success: '' });
      return;
    }

    const next = [
      {
        id: Date.now(),
        brand: detectCardBrand(digits),
        last4: digits.slice(-4),
        exp_month: cardForm.exp_month,
        exp_year: cardForm.exp_year,
        cardholder_name: cardForm.cardholder_name.trim() || billingAddress.full_name,
      },
      ...cards,
    ];
    setCards(next);
    saveProfileSnapshot(CARDS_KEY, next);
    setCardForm(EMPTY_CARD_FORM);
    setAddingCard(false);
    setMessage({ error: '', success: 'Card saved (metadata only).' });
  };

  const deleteCard = (id) => {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    saveProfileSnapshot(CARDS_KEY, next);
    setMessage({ error: '', success: 'Card removed.' });
  };

  const startUpgrade = async (planCode) => {
    if (planCode === 'free') return;
    setMessage({ error: '', success: '' });
    setCheckoutPlan(planCode);
    try {
      const res = await createCheckoutSession(planCode);
      if (res?.status !== 'OK' || !res?.data?.checkout_url) {
        throw new Error(res?.message || 'Could not start checkout.');
      }
      window.location.href = res.data.checkout_url;
    } catch (e) {
      setMessage({ error: apiErrorMessage(e), success: '' });
    } finally {
      setCheckoutPlan('');
    }
  };

  const currentPlanCode = normalizePlanCode(subscription?.plan_code || 'free');

  return (
    <div className="space-y-5">
      {status.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.error}
        </div>
      )}
      {status.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {status.success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-dark">Billing address</h3>
            {billingAddress && !editingAddress && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Saved
              </span>
            )}
          </div>

          {billingAddress && !editingAddress ? (
            <div className="space-y-4">
              <div className="space-y-1 text-sm text-brand-dark/80">
                <p className="font-medium text-brand-dark">{billingAddress.full_name}</p>
                <p>{billingAddress.address_line1}</p>
                {billingAddress.address_line2 && <p>{billingAddress.address_line2}</p>}
                <p>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                </p>
                <p>{billingAddress.country}</p>
                {billingAddress.phone && <p>{billingAddress.phone}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setEditingAddress(true)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  className="bg-white text-red-600 border-red-200 hover:bg-red-50"
                  onClick={deleteAddress}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={saveAddress}>
              <Input
                label="Full name *"
                name="full_name"
                value={addressForm.full_name}
                onChange={onAddressChange}
              />
              <Input
                label="Address line 1 *"
                name="address_line1"
                value={addressForm.address_line1}
                onChange={onAddressChange}
              />
              <Input
                label="Address line 2"
                name="address_line2"
                value={addressForm.address_line2}
                onChange={onAddressChange}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="City *" name="city" value={addressForm.city} onChange={onAddressChange} />
                <Input label="State *" name="state" value={addressForm.state} onChange={onAddressChange} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Postal code *"
                  name="postal_code"
                  value={addressForm.postal_code}
                  onChange={onAddressChange}
                />
                <Input
                  label="Country *"
                  name="country"
                  value={addressForm.country}
                  onChange={onAddressChange}
                />
              </div>
              <Input label="Phone" name="phone" value={addressForm.phone} onChange={onAddressChange} />
              <div className="flex gap-2 pt-1">
                <Button type="submit">Save address</Button>
                {billingAddress && (
                  <Button
                    type="button"
                    className="bg-white text-brand-dark border-black/10 hover:bg-black/5"
                    onClick={() => {
                      setEditingAddress(false);
                      setAddressForm(billingAddress);
                      setMessage({ error: '', success: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-dark">Payment methods</h3>
            {!addingCard && (
              <Button
                type="button"
                disabled={!billingAddress}
                onClick={() => {
                  setAddingCard(true);
                  setMessage({ error: '', success: '' });
                }}
              >
                Add card
              </Button>
            )}
          </div>

          {!billingAddress && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Save billing address before adding a card.
            </p>
          )}

          {cards.length === 0 && !addingCard && (
            <p className="text-sm text-brand-dark/60">No saved cards yet.</p>
          )}

          {cards.length > 0 && !addingCard && (
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-xl border border-black/10 bg-[#f7f7f2] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs text-brand-dark/60">
                      Expires {card.exp_month}/{card.exp_year}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-white text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteCard(card.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}

          {addingCard && (
            <form className="space-y-3 border-t border-black/5 pt-4" onSubmit={saveCard}>
              <Input
                label="Card number *"
                value={cardForm.card_number}
                onChange={(e) => {
                  setCardForm((prev) => ({
                    ...prev,
                    card_number: formatCardNumber(e.target.value),
                  }));
                  setMessage({ error: '', success: '' });
                }}
                placeholder="1234 5678 9012 3456"
              />
              <Input
                label="Cardholder name"
                value={cardForm.cardholder_name}
                onChange={(e) => {
                  setCardForm((prev) => ({ ...prev, cardholder_name: e.target.value }));
                  setMessage({ error: '', success: '' });
                }}
                placeholder="Name on card"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Expiry month *</label>
                  <select
                    value={cardForm.exp_month}
                    onChange={(e) => {
                      setCardForm((prev) => ({ ...prev, exp_month: e.target.value }));
                      setMessage({ error: '', success: '' });
                    }}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">MM</option>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Expiry year *</label>
                  <select
                    value={cardForm.exp_year}
                    onChange={(e) => {
                      setCardForm((prev) => ({ ...prev, exp_year: e.target.value }));
                      setMessage({ error: '', success: '' });
                    }}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">YYYY</option>
                    {expiryYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-brand-dark/55">
                Only card metadata is saved in this profile view (brand, last4, expiry).
              </p>
              <div className="flex gap-2 pt-1">
                <Button type="submit">Save card</Button>
                <Button
                  type="button"
                  className="bg-white text-brand-dark border-black/10 hover:bg-black/5"
                  onClick={() => {
                    setAddingCard(false);
                    setCardForm(EMPTY_CARD_FORM);
                    setMessage({ error: '', success: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-brand-dark">Upgrade plan</h3>
            <p className="mt-1 text-sm text-brand-dark/60">
              Compare tiers and continue to secure Stripe checkout.
            </p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-dark/60">
            {loadingSub
              ? 'Checking subscription...'
              : `Current plan: ${currentPlanCode.replace('_monthly', '')}`}
          </div>
        </div>
        <Button type="button" onClick={() => setUpgradeOpen(true)}>
          View plans
        </Button>
      </section>

      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-brand-dark">Choose your plan</h3>
                <p className="mt-1 text-sm text-brand-dark/60">
                  Current plan: {currentPlanCode.replace('_monthly', '')}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-brand-dark hover:bg-black/5"
                onClick={() => setUpgradeOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {TIERS.map((tier) => {
                const isCurrent = tier.code === currentPlanCode;
                const currentRank = TIER_RANK[currentPlanCode] ?? 0;
                const tierRank = TIER_RANK[tier.code] ?? 0;
                const isLowerTier = tierRank < currentRank;
                const isDisabled = isCurrent || isLowerTier || checkoutPlan === tier.code;
                const buttonTone = isLowerTier
                  ? '!bg-slate-300 !text-slate-600 !border-slate-300 hover:!bg-slate-300'
                  : '';
                const tierTone =
                  tier.code === 'free'
                    ? 'border-slate-300 bg-slate-100'
                    : tier.code === 'premium_monthly'
                      ? 'border-green-300 bg-green-50'
                      : 'border-[#d4b06a] bg-[#f7e8be]';

                return (
                  <article key={tier.code} className={['rounded-2xl border px-4 py-4', tierTone].join(' ')}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-brand-dark">{tier.name}</h4>
                      {isCurrent && (
                        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold text-brand-dark">{tier.price}</p>
                    <ul className="mt-3 space-y-1 text-xs text-brand-dark/80">
                      {tier.features.map((feature) => (
                        <li key={feature}>- {feature}</li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      disabled={isDisabled}
                      className={['mt-4 w-full', buttonTone].join(' ')}
                      onClick={() => startUpgrade(tier.code)}
                    >
                      {isCurrent
                        ? 'Current plan'
                        : isLowerTier
                          ? 'Lower tier unavailable'
                          : checkoutPlan === tier.code
                          ? 'Redirecting...'
                          : 'Upgrade plan'}
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBilling;
