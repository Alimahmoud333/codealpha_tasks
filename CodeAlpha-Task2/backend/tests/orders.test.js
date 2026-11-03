import "./setup.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import pool from "../src/config/database.js";
import { api, bearer, createAdmin, createProduct, registerUser, shipping, stockOf } from "./helpers.js";

after(() => pool.end());

async function fillCart(token, productId, quantity) {
  const res = await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity });
  assert.equal(res.status, 201);
}

describe("checkout and orders", () => {
  it("creates an order, reduces stock, empties the cart and uses database prices", async () => {
    const { token } = await registerUser();
    const productId = await createProduct({ price: 20, stock: 5 });
    await fillCart(token, productId, 2);

    const res = await api()
      .post("/api/orders")
      .set(bearer(token))
      .send({ ...shipping, total: 0.01, status: "delivered" }); // client extras must be ignored

    assert.equal(res.status, 201);
    assert.equal(res.body.data.total, 40);
    assert.equal(res.body.data.status, "pending");
    assert.equal(res.body.data.items[0].unitPrice, 20);
    assert.equal(await stockOf(productId), 3);

    const cart = await api().get("/api/cart").set(bearer(token));
    assert.equal(cart.body.data.items.length, 0);
  });

  it("keeps the purchase price when the product price changes later", async () => {
    const { token } = await registerUser();
    const productId = await createProduct({ price: 30, stock: 5 });
    await fillCart(token, productId, 1);
    const order = (await api().post("/api/orders").set(bearer(token)).send(shipping)).body.data;

    await pool.execute("UPDATE products SET price = 99 WHERE id = ?", [productId]);

    const again = await api().get(`/api/orders/${order.id}`).set(bearer(token));
    assert.equal(again.body.data.items[0].unitPrice, 30);
    assert.equal(again.body.data.total, 30);
  });

  it("rejects an empty cart and invalid delivery details", async () => {
    const { token } = await registerUser();

    assert.equal((await api().post("/api/orders").set(bearer(token)).send(shipping)).status, 400);
    assert.equal((await api().post("/api/orders").set(bearer(token)).send({ ...shipping, fullName: "" })).status, 422);
  });

  it("rolls back completely when stock is insufficient", async () => {
    const { token } = await registerUser();
    const plentiful = await createProduct({ stock: 10 });
    const scarce = await createProduct({ stock: 2 });
    await fillCart(token, plentiful, 1);
    await fillCart(token, scarce, 2);

    await pool.execute("UPDATE products SET stock = 1 WHERE id = ?", [scarce]); // someone else bought one

    const res = await api().post("/api/orders").set(bearer(token)).send(shipping);

    assert.equal(res.status, 409);
    assert.equal(res.body.error.details.items[0].available, 1);
    assert.equal(await stockOf(plentiful), 10); // untouched
    assert.equal((await api().get("/api/cart").set(bearer(token))).body.data.items.length, 2);
    assert.equal((await api().get("/api/orders").set(bearer(token))).body.meta.total, 0);
  });

  it("lets only one of two simultaneous buyers get the last item", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const productId = await createProduct({ stock: 1 });
    await fillCart(a.token, productId, 1);
    await fillCart(b.token, productId, 1);

    const results = await Promise.all([
      api().post("/api/orders").set(bearer(a.token)).send(shipping),
      api().post("/api/orders").set(bearer(b.token)).send(shipping),
    ]);

    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await stockOf(productId), 0);
  });

  it("only shows a customer their own orders", async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const productId = await createProduct({ stock: 5 });
    await fillCart(owner.token, productId, 1);
    const order = (await api().post("/api/orders").set(bearer(owner.token)).send(shipping)).body.data;

    assert.equal((await api().get(`/api/orders/${order.id}`).set(bearer(owner.token))).status, 200);
    assert.equal((await api().get(`/api/orders/${order.id}`).set(bearer(stranger.token))).status, 404);
    assert.equal((await api().get("/api/orders").set(bearer(stranger.token))).body.meta.total, 0);
    assert.equal((await api().get(`/api/orders/${order.id}`)).status, 401);
  });

  it("restricts status changes to admins, enforces transitions and restocks on cancel", async () => {
    const customer = await registerUser();
    const admin = await createAdmin();
    const productId = await createProduct({ stock: 4 });
    await fillCart(customer.token, productId, 3);
    const order = (await api().post("/api/orders").set(bearer(customer.token)).send(shipping)).body.data;
    assert.equal(await stockOf(productId), 1);

    const asCustomer = await api().patch(`/api/admin/orders/${order.id}/status`).set(bearer(customer.token)).send({ status: "shipped" });
    assert.equal(asCustomer.status, 403);

    const skip = await api().patch(`/api/admin/orders/${order.id}/status`).set(bearer(admin.token)).send({ status: "delivered" });
    assert.equal(skip.status, 409);

    const cancel = await api().patch(`/api/admin/orders/${order.id}/status`).set(bearer(admin.token)).send({ status: "cancelled" });
    assert.equal(cancel.status, 200);
    assert.equal(await stockOf(productId), 4);

    const reopen = await api().patch(`/api/admin/orders/${order.id}/status`).set(bearer(admin.token)).send({ status: "processing" });
    assert.equal(reopen.status, 409);
  });
});
