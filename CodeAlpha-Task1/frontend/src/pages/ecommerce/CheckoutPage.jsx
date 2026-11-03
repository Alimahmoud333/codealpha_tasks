import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { TextAreaField, TextField } from "../../components/common/Field.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import APP_ROUTES, { orderConfirmationPath } from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import useCart from "../../hooks/useCart.js";
import orderService from "../../services/orderService.js";
import { formatPrice } from "../../utils/format.js";
import { hasErrors, validateCheckout } from "../../utils/validation.js";

const FIELD_LABELS = {
  fullName: "Full name",
  phone: "Phone",
  address: "Address",
  city: "City",
  postalCode: "Postal code",
  country: "Country",
  notes: "Notes",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, hasStockIssues, initialized, loading, refresh } = useCart();

  const [values, setValues] = useState({ fullName: user?.name ?? "", phone: "", address: "", city: "", postalCode: "", country: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [stockProblems, setStockProblems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef(null);

  const setField = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  // After a failed submit, move keyboard/screen-reader focus to the list of problems.
  const showProblems = () => setTimeout(() => summaryRef.current?.focus(), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setStockProblems([]);

    const clientErrors = validateCheckout(values);
    setErrors(clientErrors);

    if (hasErrors(clientErrors)) {
      showProblems();
      return;
    }

    setSubmitting(true);
    try {
      // Only delivery details are sent. Prices and totals are calculated by the server.
      const order = await orderService.create(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])));
      navigate(orderConfirmationPath(order.id), { replace: true });
      refresh(); // the server emptied the cart
    } catch (error) {
      const details = error.response?.data?.error?.details;

      if (error.response?.status === 409 && Array.isArray(details?.items)) {
        setStockProblems(details.items);
        setFormError("Some items changed while you were checking out.");
        refresh();
      } else {
        setErrors(getFieldErrors(error));
        setFormError(getApiErrorMessage(error, "Your order could not be placed."));
      }
      showProblems();
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized && loading) return <Spinner label="Loading your cart…" fullPage />;

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page__title">Checkout</h1>
        <EmptyState
          title="Your cart is empty"
          action={
            <Link to={APP_ROUTES.SHOP} className="btn btn--primary">
              Continue shopping
            </Link>
          }
        >
          Add something to your cart before checking out.
        </EmptyState>
      </div>
    );
  }

  const problemMessages = Object.entries(errors).map(([field, message]) => `${FIELD_LABELS[field] ?? field}: ${message}`);

  return (
    <div className="container page">
      <h1 className="page__title">Checkout</h1>

      <div className="cart">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          {(formError || problemMessages.length > 0) && (
            <div className="error-box" role="alert" tabIndex={-1} ref={summaryRef}>
              <p className="error-box__title">{formError || "Please correct the following:"}</p>
              {stockProblems.length > 0 && (
                <ul>
                  {stockProblems.map((problem) => (
                    <li key={problem.productId}>
                      {problem.name}: {problem.available === 0 ? "no longer available" : `only ${problem.available} left (you asked for ${problem.requested})`}.{" "}
                      <Link to={APP_ROUTES.CART}>Update your cart</Link>
                    </li>
                  ))}
                </ul>
              )}
              {problemMessages.length > 0 && (
                <ul>
                  {problemMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <fieldset className="form-section">
            <legend>Delivery details</legend>
            <TextField label="Full name" autoComplete="name" value={values.fullName} onChange={setField("fullName")} error={errors.fullName} />
            <TextField label="Phone" type="tel" autoComplete="tel" value={values.phone} onChange={setField("phone")} error={errors.phone} />
            <TextField label="Address" autoComplete="street-address" value={values.address} onChange={setField("address")} error={errors.address} />
            <div className="form-row">
              <TextField label="City" autoComplete="address-level2" value={values.city} onChange={setField("city")} error={errors.city} />
              <TextField label="Postal code" autoComplete="postal-code" value={values.postalCode} onChange={setField("postalCode")} error={errors.postalCode} />
            </div>
            <TextField label="Country" autoComplete="country-name" value={values.country} onChange={setField("country")} error={errors.country} />
            <TextAreaField label="Delivery notes (optional)" rows={3} value={values.notes} onChange={setField("notes")} error={errors.notes} hint="For example: ring the bell twice." />
          </fieldset>

          <fieldset className="form-section">
            <legend>Payment</legend>
            <p>Cash on delivery. You pay the courier when your order arrives.</p>
          </fieldset>

          <Button type="submit" loading={submitting} disabled={hasStockIssues}>
            Place order
          </Button>
          {hasStockIssues && <p className="field__error">Some cart items exceed the available stock. <Link to={APP_ROUTES.CART}>Review your cart</Link>.</p>}
        </form>

        <aside className="summary" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title" className="summary__title">
            Your order
          </h2>
          <ul className="summary__items">
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} <span className="muted">× {item.quantity}</span>
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__rows">
            <div className="summary__total">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="field__hint">The final amount is calculated by the store when you place the order.</p>
        </aside>
      </div>
    </div>
  );
}
