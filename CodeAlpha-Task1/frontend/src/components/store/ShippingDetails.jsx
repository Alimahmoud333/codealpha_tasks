export default function ShippingDetails({ order }) {
  const { shipping } = order;

  return (
    <dl className="details">
      <div>
        <dt>Deliver to</dt>
        <dd>
          {shipping.fullName}
          <br />
          {shipping.address}
          <br />
          {shipping.postalCode} {shipping.city}
          <br />
          {shipping.country}
        </dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>{shipping.phone}</dd>
      </div>
      <div>
        <dt>Payment</dt>
        <dd>Cash on delivery</dd>
      </div>
      {order.notes && (
        <div>
          <dt>Delivery notes</dt>
          <dd>{order.notes}</dd>
        </div>
      )}
    </dl>
  );
}
