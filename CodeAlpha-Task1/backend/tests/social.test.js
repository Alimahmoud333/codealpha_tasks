import "./setup.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import pool from "../src/config/database.js";
import { api, bearer, createAdmin, registerUser } from "./helpers.js";

after(() => pool.end());

async function createPost(token, content = "Hello from a test") {
  const res = await api().post("/api/posts").set(bearer(token)).send({ content });
  assert.equal(res.status, 201);
  return res.body.data;
}

describe("posts", () => {
  it("requires authentication", async () => {
    assert.equal((await api().get("/api/posts")).status, 401);
    assert.equal((await api().post("/api/posts").send({ content: "x" })).status, 401);
  });

  it("creates a post as the logged-in user, ignoring any userId in the body", async () => {
    const me = await registerUser();
    const other = await registerUser();

    const res = await api().post("/api/posts").set(bearer(me.token)).send({ content: "Mine", userId: other.user.id });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.author.id, me.user.id);
    assert.equal(res.body.data.likeCount, 0);
    assert.equal(res.body.data.commentCount, 0);
  });

  it("validates post content", async () => {
    const { token } = await registerUser();

    const empty = await api().post("/api/posts").set(bearer(token)).send({ content: "   " });
    const tooLong = await api().post("/api/posts").set(bearer(token)).send({ content: "a".repeat(1001) });

    assert.equal(empty.status, 422);
    assert.equal(tooLong.status, 422);
  });

  it("lets only the author edit, and the author or an admin delete", async () => {
    const author = await registerUser();
    const stranger = await registerUser();
    const admin = await createAdmin();
    const post = await createPost(author.token);

    const strangerEdit = await api().put(`/api/posts/${post.id}`).set(bearer(stranger.token)).send({ content: "Hacked" });
    const adminEdit = await api().put(`/api/posts/${post.id}`).set(bearer(admin.token)).send({ content: "Hacked" });
    const authorEdit = await api().put(`/api/posts/${post.id}`).set(bearer(author.token)).send({ content: "Edited" });

    assert.equal(strangerEdit.status, 403);
    assert.equal(adminEdit.status, 403);
    assert.equal(authorEdit.status, 200);
    assert.equal(authorEdit.body.data.content, "Edited");

    assert.equal((await api().delete(`/api/posts/${post.id}`).set(bearer(stranger.token))).status, 403);
    assert.equal((await api().delete(`/api/posts/${post.id}`).set(bearer(admin.token))).status, 204);
    assert.equal((await api().get(`/api/posts/${post.id}`).set(bearer(author.token))).status, 404);
  });

  it("pages the feed with a cursor and filters by author", async () => {
    const a = await registerUser();
    const b = await registerUser();
    for (let i = 1; i <= 3; i++) await createPost(a.token, `A post ${i}`);
    await createPost(b.token, "B post");

    const first = await api().get(`/api/posts?userId=${a.user.id}&limit=2`).set(bearer(a.token));
    assert.equal(first.body.data.length, 2);
    assert.ok(first.body.meta.nextCursor);
    assert.equal(first.body.data[0].content, "A post 3"); // newest first

    const second = await api().get(`/api/posts?userId=${a.user.id}&limit=2&cursor=${first.body.meta.nextCursor}`).set(bearer(a.token));
    assert.equal(second.body.data.length, 1);
    assert.equal(second.body.meta.nextCursor, null);
  });
});

describe("comments", () => {
  it("creates, lists, edits and deletes with ownership rules", async () => {
    const author = await registerUser();
    const commenter = await registerUser();
    const stranger = await registerUser();
    const admin = await createAdmin();
    const post = await createPost(author.token);

    const created = await api().post(`/api/posts/${post.id}/comments`).set(bearer(commenter.token)).send({ content: "Nice post" });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.commentCount, 1);
    const commentId = created.body.data.comment.id;

    assert.equal((await api().post(`/api/posts/${post.id}/comments`).set(bearer(commenter.token)).send({ content: "" })).status, 422);
    assert.equal((await api().post("/api/posts/999999/comments").set(bearer(commenter.token)).send({ content: "x" })).status, 404);

    const list = await api().get(`/api/posts/${post.id}/comments`).set(bearer(author.token));
    assert.equal(list.body.data[0].author.id, commenter.user.id);

    // The post author does not own the comment, so they can't edit it either.
    assert.equal((await api().put(`/api/comments/${commentId}`).set(bearer(author.token)).send({ content: "Changed" })).status, 403);
    assert.equal((await api().put(`/api/comments/${commentId}`).set(bearer(stranger.token)).send({ content: "Changed" })).status, 403);
    assert.equal((await api().put(`/api/comments/${commentId}`).set(bearer(commenter.token)).send({ content: "Edited" })).body.data.content, "Edited");

    assert.equal((await api().delete(`/api/comments/${commentId}`).set(bearer(stranger.token))).status, 403);

    const second = await api().post(`/api/posts/${post.id}/comments`).set(bearer(commenter.token)).send({ content: "Another" });
    const removed = await api().delete(`/api/comments/${second.body.data.comment.id}`).set(bearer(admin.token));
    assert.equal(removed.status, 200);
    assert.equal(removed.body.data.commentCount, 1);

    const reloaded = await api().get(`/api/posts/${post.id}`).set(bearer(author.token));
    assert.equal(reloaded.body.data.commentCount, 1);
  });
});

describe("likes", () => {
  it("never counts the same user twice, and supports unlike", async () => {
    const author = await registerUser();
    const fan = await registerUser();
    const post = await createPost(author.token);

    const first = await api().post(`/api/posts/${post.id}/like`).set(bearer(fan.token));
    const again = await api().post(`/api/posts/${post.id}/like`).set(bearer(fan.token));
    assert.deepEqual(first.body.data, { likeCount: 1, likedByMe: true });
    assert.deepEqual(again.body.data, { likeCount: 1, likedByMe: true });

    const asAuthor = await api().get(`/api/posts/${post.id}`).set(bearer(author.token));
    assert.equal(asAuthor.body.data.likeCount, 1);
    assert.equal(asAuthor.body.data.likedByMe, false);

    const unliked = await api().delete(`/api/posts/${post.id}/like`).set(bearer(fan.token));
    assert.deepEqual(unliked.body.data, { likeCount: 0, likedByMe: false });
  });

  it("survives simultaneous duplicate likes", async () => {
    const author = await registerUser();
    const fan = await registerUser();
    const post = await createPost(author.token);

    await Promise.all([1, 2, 3].map(() => api().post(`/api/posts/${post.id}/like`).set(bearer(fan.token))));

    const reloaded = await api().get(`/api/posts/${post.id}`).set(bearer(author.token));
    assert.equal(reloaded.body.data.likeCount, 1);
  });

  it("returns 404 for a missing post", async () => {
    const { token } = await registerUser();
    assert.equal((await api().post("/api/posts/999999/like").set(bearer(token))).status, 404);
  });
});

describe("follows and profiles", () => {
  it("prevents self-follow and duplicate follows, and keeps counts accurate", async () => {
    const a = await registerUser();
    const b = await registerUser();

    assert.equal((await api().post(`/api/users/${a.user.id}/follow`).set(bearer(a.token))).status, 400);
    assert.equal((await api().post("/api/users/999999/follow").set(bearer(a.token))).status, 404);

    await api().post(`/api/users/${b.user.id}/follow`).set(bearer(a.token));
    const again = await api().post(`/api/users/${b.user.id}/follow`).set(bearer(a.token));
    assert.deepEqual(again.body.data, { following: true, followerCount: 1 });

    const profile = await api().get(`/api/users/${b.user.id}`).set(bearer(a.token));
    assert.deepEqual(profile.body.data.stats, { posts: 0, followers: 1, following: 0 });
    assert.equal(profile.body.data.isFollowing, true);
    assert.equal(profile.body.data.email, undefined);

    const followers = await api().get(`/api/users/${b.user.id}/followers`).set(bearer(b.token));
    assert.equal(followers.body.data[0].id, a.user.id);
    const following = await api().get(`/api/users/${a.user.id}/following`).set(bearer(a.token));
    assert.equal(following.body.data[0].id, b.user.id);

    const unfollowed = await api().delete(`/api/users/${b.user.id}/follow`).set(bearer(a.token));
    assert.deepEqual(unfollowed.body.data, { following: false, followerCount: 0 });
  });

  it("shows followed users' posts (and my own) in the following feed", async () => {
    const me = await registerUser();
    const friend = await registerUser();
    const stranger = await registerUser();
    await createPost(friend.token, "From my friend");
    await createPost(stranger.token, "From a stranger");
    await createPost(me.token, "My own post");

    await api().post(`/api/users/${friend.user.id}/follow`).set(bearer(me.token));

    const feed = await api().get("/api/posts?scope=following").set(bearer(me.token));
    assert.deepEqual(feed.body.data.map((p) => p.content).sort(), ["From my friend", "My own post"]);
  });

  it("updates only my own profile and ignores username, email and role", async () => {
    const me = await registerUser();

    const res = await api()
      .put("/api/users/me")
      .set(bearer(me.token))
      .send({ name: "New Name", bio: "New bio", username: "hacker", email: "x@example.com", role: "admin", id: 1 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, "New Name");
    assert.equal(res.body.data.user.bio, "New bio");
    assert.equal(res.body.data.user.username, me.user.username);
    assert.equal(res.body.data.user.email, me.email);
    assert.equal(res.body.data.user.role, "customer");
  });

  it("rejects a non-image upload even when it is named like one", async () => {
    const me = await registerUser();

    const res = await api()
      .put("/api/users/me")
      .set(bearer(me.token))
      .field("name", "Me")
      .attach("avatar", Buffer.from("<?php echo 'not an image'; ?>"), { filename: "avatar.png", contentType: "image/png" });

    assert.equal(res.status, 422);
  });

  it("searches users and suggests people not yet followed", async () => {
    const me = await registerUser({ name: "Searcher" });
    const target = await registerUser({ name: "Findable Person" });

    const search = await api().get("/api/users?q=Findable").set(bearer(me.token));
    assert.equal(search.body.data[0].id, target.user.id);

    const suggestions = await api().get("/api/users?limit=50").set(bearer(me.token));
    assert.ok(suggestions.body.data.some((u) => u.id === target.user.id));
    assert.equal(suggestions.body.data.some((u) => u.id === me.user.id), false);
  });
});
