import "./setup.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import pool from "../src/config/database.js";
import { api, bearer, createProduct, registerUser } from "./helpers.js";

after(() => pool.end());

describe("cart", () => {
  it("requires authentication", async () => {
    assert.equal((await api().get("/api/cart")).status, 401);
  });

  it("adds items, merges quantities and calculates totals from database prices", async () => {
    const { token } = await registerUser();
    const productId = await createProduct({ price: 12.5, stock: 10 });

    await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity: 2, price: 0.01 });
    const res = await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity: 1 });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.items.length, 1);
    assert.equal(res.body.data.items[0].quantity, 3);
    assert.equal(res.body.data.total, 37.5); // the fake client price was ignored
  });

  it("rejects invalid quantities and quantities above stock", async () => {
    const { token } = await registerUser();
    const productId = await createProduct({ stock: 2 });

    const zero = await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity: 0 });
    const fractional = await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity: 1.5 });
    const tooMany = await api().post("/api/cart/items").set(bearer(token)).send({ productId, quantity: 3 });

    assert.equal(zero.status, 422);
    assert.equal(fractional.status, 422);
    assert.equal(tooMany.status, 409);
  });

  it("updates and removes items, and hides other users' items (404)", async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const productId = await createProduct({ stock: 10 });

    const added = await api().post("/api/cart/items").set(bearer(owner.token)).send({ productId, quantity: 1 });
    const itemId = added.body.data.items[0].id;

    const hijack = await api().patch(`/api/cart/items/${itemId}`).set(bearer(stranger.token)).send({ quantity: 5 });
    assert.equal(hijack.status, 404);
    assert.equal((await api().delete(`/api/cart/items/${itemId}`).set(bearer(stranger.token))).status, 404);

    const updated = await api().patch(`/api/cart/items/${itemId}`).set(bearer(owner.token)).send({ quantity: 4 });
    assert.equal(updated.body.data.items[0].quantity, 4);

    const removed = await api().delete(`/api/cart/items/${itemId}`).set(bearer(owner.token));
    assert.equal(removed.body.data.items.length, 0);
  });
});
