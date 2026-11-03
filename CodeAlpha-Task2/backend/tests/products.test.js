import "./setup.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import pool from "../src/config/database.js";
import { api, bearer, createAdmin, createProduct, registerUser } from "./helpers.js";

after(() => pool.end());

describe("products", () => {
  it("lists, searches and sorts products publicly", async () => {
    await createProduct({ name: "Zebra Searchable Bag", price: 50 });
    await createProduct({ name: "Another Searchable Bag", price: 20 });

    const res = await api().get("/api/products?search=Searchable&sort=price_asc");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.price), [20, 50]);
    assert.equal(res.body.meta.total, 2);
  });

  it("returns 404 for a missing product and 422 for a bad id", async () => {
    assert.equal((await api().get("/api/products/999999")).status, 404);
    assert.equal((await api().get("/api/products/abc")).status, 422);
  });

  it("blocks anonymous users and customers from managing products", async () => {
    const body = { name: "Hacked", description: "x", price: 1, stock: 1, categoryId: 1 };
    const { token } = await registerUser();

    assert.equal((await api().post("/api/products").send(body)).status, 401);
    assert.equal((await api().post("/api/products").set(bearer(token)).send(body)).status, 403);
  });

  it("lets an admin create, update and soft-delete a product", async () => {
    const { token } = await createAdmin();
    await createProduct(); // makes sure a category exists
    const categoryId = (await api().get("/api/categories")).body.data[0].id;

    const created = await api()
      .post("/api/products")
      .set(bearer(token))
      .send({ name: "Admin Product", description: "Made by admin", price: 19.99, stock: 7, categoryId });
    assert.equal(created.status, 201);

    const id = created.body.data.id;
    const updated = await api()
      .put(`/api/products/${id}`)
      .set(bearer(token))
      .send({ name: "Admin Product v2", description: "Edited", price: 24.5, stock: 3, categoryId });
    assert.equal(updated.body.data.price, 24.5);

    assert.equal((await api().delete(`/api/products/${id}`).set(bearer(token))).status, 204);
    assert.equal((await api().get(`/api/products/${id}`)).status, 404);
  });
});
