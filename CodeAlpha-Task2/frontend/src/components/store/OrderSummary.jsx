import { Link } from "react-router-dom";
import { productPath } from "../../constants/appRoutes.js";
import { formatPrice } from "../../utils/format.js";

/* Items + total of a placed order. Uses the snapshot (name, price) saved with the order. */
export default function OrderSummary({ order }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="visually-hidden">Items in order {order.id}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="num">Price</th>
            <th scope="col" className="num">Qty</th>
            <th scope="col" className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link to={productPath(item.productId)}>{item.name}</Link>
              </td>
              <td className="num">{formatPrice(item.unitPrice)}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{formatPrice(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan="3">
              Total
            </th>
            <td className="num table__total">{formatPrice(order.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
