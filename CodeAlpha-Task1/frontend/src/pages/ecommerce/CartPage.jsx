import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios.js";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import QuantityInput from "../../components/store/QuantityInput.jsx";
import { MAX_QUANTITY } from "../../constants/appConfig.js";
import APP_ROUTES, { productPath } from "../../constants/appRoutes.js";
import useCart from "../../hooks/useCart.js";
import useToast from "../../hooks/useToast.js";
import { formatPrice, pluralize } from "../../utils/format.js";

export default function CartPage() {
  const { items, itemCount, total, hasStockIssues, loading, initialized, error, refresh, updateItem, removeItem } = useCart();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null); // the cart row currently talking to the server

  const run = async (itemId, action, failureMessage) => {
    setBusyId(itemId);
    try {
      await action();
    } catch (actionError) {
      toast.error(getApiErrorMessage(actionError, failureMessage));
      refresh(); // show what the server really has
    } finally {
      setBusyId(null);
    }
  };

  if (!initialized && loading) return <Spinner label="Loading your cart…" fullPage />;

  if (error && !initialized) {
    return (
      <div className="container page">
        <ErrorMessage title="Your cart could not be loaded" message={error} onRetry={refresh} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page__title">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          action={
            <Link to={APP_ROUTES.SHOP} className="btn btn--primary">
              Continue shopping
            </Link>
          }
        >
          Products you add will wait here until you check out.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page__title">Your cart</h1>

      <div className="cart">
        <ul className="cart__list">
          {items.map((item) => {
            const busy = busyId === item.id;
            const unavailable = item.stock === 0;

            return (
              <li key={item.id} className="cart-item" aria-busy={busy}>
                <Link to={productPath(item.productId)} className="cart-item__image" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={item.imageUrl} alt="" />
                </Link>

                <div className="cart-item__main">
                  <h2 className="cart-item__name">
                    <Link to={productPath(item.productId)}>{item.name}</Link>
                  </h2>
                  <p className="cart-item__price">{formatPrice(item.unitPrice)} each</p>

                  {item.exceedsStock && (
                    <p className="field__error" role="alert">
                      {unavailable ? "This product is out of stock. Remove it to continue." : `Only ${item.stock} available. Lower the quantity to continue.`}
                    </p>
                  )}

                  <div className="cart-item__controls">
                    {!unavailable && (
                      <QuantityInput
                        value={item.quantity}
                        max={Math.min(item.stock, MAX_QUANTITY)}
                        disabled={busy}
                        label={`Quantity for ${item.name}`}
                        onChange={(quantity) => run(item.id, () => updateItem(item.id, quantity), "Could not update the quantity.")}
                      />
                    )}
                    <Button variant="ghost" disabled={busy} onClick={() => run(item.id, () => removeItem(item.id), "Could not remove this item.")}>
                      Remove<span className="visually-hidden"> {item.name}</span>
                    </Button>
                  </div>
                </div>

                <p className="cart-item__total">{formatPrice(item.lineTotal)}</p>
              </li>
            );
          })}
        </ul>

        <aside className="summary" aria-labelledby="summary-title">
          <h2 id="summary-title" className="summary__title">
            Order summary
          </h2>
          <dl className="summary__rows">
            <div>
              <dt>
                {itemCount} {pluralize(itemCount, "item")}
              </dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>Arranged at checkout</dd>
            </div>
            <div className="summary__total">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          {hasStockIssues ? (
            <>
              <Button disabled>Proceed to checkout</Button>
              <p className="field__hint">Fix the highlighted items to continue.</p>
            </>
          ) : (
            <Link to={APP_ROUTES.CHECKOUT} className="btn btn--primary">
              Proceed to checkout
            </Link>
          )}
          <p className="field__hint">Payment is cash on delivery. Prices are confirmed by the store at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
