import "./setup.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import pool from "../src/config/database.js";
import { PASSWORD, api, bearer, registerUser } from "./helpers.js";

after(() => pool.end());

describe("authentication", () => {
  it("registers a customer and never returns the password hash", async () => {
    const { res } = await registerUser();

    assert.equal(res.status, 201);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, "customer");
    assert.equal(JSON.stringify(res.body).includes("password"), false);
  });

  it("ignores a client-supplied role (no privilege escalation)", async () => {
    const { res } = await registerUser({ role: "admin" });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, "customer");
  });

  it("rejects duplicate emails", async () => {
    const { email } = await registerUser();
    const { res } = await registerUser({ email });

    assert.equal(res.status, 409);
  });

  it("rejects a duplicate or invalid username", async () => {
    const first = await registerUser();
    const taken = await registerUser({ username: first.user.username.toUpperCase() });
    const invalid = await registerUser({ username: "bad name!" });

    assert.equal(taken.res.status, 409);
    assert.ok(taken.res.body.error.details.username);
    assert.equal(invalid.res.status, 422);
    assert.ok(invalid.res.body.error.details.username);
  });

  it("validates input", async () => {
    const { res } = await registerUser({ password: "short" });

    assert.equal(res.status, 422);
    assert.ok(res.body.error.details.password);
  });

  it("rejects wrong credentials with a generic message", async () => {
    const { email } = await registerUser();

    const wrongPassword = await api().post("/api/auth/login").send({ email, password: "Wrong12345" });
    const unknownEmail = await api().post("/api/auth/login").send({ email: "nobody@example.com", password: PASSWORD });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
  });

  it("logs in and protects /me", async () => {
    const { email } = await registerUser();

    const login = await api().post("/api/auth/login").send({ email, password: PASSWORD });
    assert.equal(login.status, 200);

    const me = await api().get("/api/auth/me").set(bearer(login.body.data.token));
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    assert.equal((await api().get("/api/auth/me")).status, 401);
    assert.equal((await api().get("/api/auth/me").set(bearer("not.a.token"))).status, 401);
  });
});
