import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios.js";
import Button from "../../components/common/Button.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { availabilityOf } from "../../components/store/ProductCard.jsx";
import QuantityInput from "../../components/store/QuantityInput.jsx";
import { MAX_QUANTITY } from "../../constants/appConfig.js";
import APP_ROUTES from "../../constants/appRoutes.js";
import useApiData from "../../hooks/useApiData.js";
import useAuth from "../../hooks/useAuth.js";
import useCart from "../../hooks/useCart.js";
import useToast from "../../hooks/useToast.js";
import productService from "../../services/productService.js";
import { formatPrice } from "../../utils/format.js";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated } = useAuth();
  const { items, addItem } = useCart();
  const toast = useToast();

  const { data: product, loading, error, reload } = useApiData(() => productService.get(id), [id]);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  if (loading && !product) return <Spinner label="Loading product…" fullPage />;

  if (error && !product) {
    return (
      <div className="container page">
        <ErrorMessage title="This product could not be loaded" message={error} onRetry={reload} />
        <p>
          <Link to={APP_ROUTES.SHOP}>Back to the shop</Link>
        </p>
      </div>
    );
  }

  const availability = availabilityOf(product);
  const inCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, product.stock - inCart); // how many more can still be added
  const maxQuantity = Math.min(remaining, MAX_QUANTITY);
  const selected = Math.min(quantity, Math.max(maxQuantity, 1));

  const handleAdd = async () => {
    setMessage("");

    // The cart belongs to an account: guests log in first and come back here.
    if (!authenticated) {
      navigate(APP_ROUTES.LOGIN, { state: { from: location.pathname } });
      return;
    }

    if (selected > remaining) {
      setMessage(`Only ${remaining} more can be added.`);
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, selected);
      toast.success(`${product.name} was added to your cart.`);
      setQuantity(1);
    } catch (addError) {
      setMessage(getApiErrorMessage(addError, "Could not add this item to your cart."));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to={APP_ROUTES.SHOP}>Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`${APP_ROUTES.SHOP}?category=${product.category.id}`}>{product.category.name}</Link>
      </nav>

      <div className="product-detail">
        <div className="product-detail__media">
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>

        <div className="product-detail__info">
          <p className="product-card__category">{product.category.name}</p>
          <h1 className="product-detail__name">{product.name}</h1>
          <p className="product-detail__price">{formatPrice(product.price)}</p>
          <p className={`availability availability--${availability.tone}`}>{availability.text}</p>

          <p className="product-detail__description">{product.description || "No description available."}</p>

          {product.stock > 0 ? (
            <div className="product-detail__buy">
              <div className="field">
                <span className="field__label" id="qty-label">
                  Quantity
                </span>
                <QuantityInput value={selected} onChange={setQuantity} max={Math.max(maxQuantity, 1)} disabled={remaining === 0 || adding} label="Quantity" />
                <p className="field__hint">{product.stock} available{inCart > 0 ? `, ${inCart} already in your cart` : ""}</p>
              </div>

              <Button loading={adding} disabled={remaining === 0} onClick={handleAdd}>
                {remaining === 0 ? "All available units are in your cart" : "Add to cart"}
              </Button>

              {message && (
                <p className="field__error" role="alert">
                  {message}
                </p>
              )}
              {inCart > 0 && (
                <p>
                  <Link to={APP_ROUTES.CART}>View your cart</Link>
                </p>
              )}
            </div>
          ) : (
            <p className="notice">This product is currently out of stock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
