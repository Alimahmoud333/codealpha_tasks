import { Link } from "react-router-dom";
import { LOW_STOCK_THRESHOLD } from "../../constants/appConfig.js";
import { productPath } from "../../constants/appRoutes.js";
import { formatPrice } from "../../utils/format.js";
import ProductImage from "../common/ProductImage.jsx";

export function availabilityOf(product) {
  if (product.stock === 0) return { text: "Out of stock", tone: "out" };
  if (product.stock <= LOW_STOCK_THRESHOLD) return { text: `Only ${product.stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
}

export default function ProductCard({ product }) {
  const availability = availabilityOf(product);

  return (
    <article className="product-card">
      <div className="product-card__media">
        <ProductImage src={product.imageUrl} alt="" />
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{product.category.name}</p>
        <h3 className="product-card__name">
          {/* The link's ::after covers the whole card, so the entire card is clickable and focusable once. */}
          <Link to={productPath(product.id)} className="product-card__link">
            {product.name}
          </Link>
        </h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <p className={`availability availability--${availability.tone}`}>{availability.text}</p>
      </div>
    </article>
  );
}
