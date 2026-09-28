import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();

vi.mock("@upstash/redis", () => {
  class FakeRedis {
    static fromEnv() {
      return new FakeRedis();
    }
    async get(key: string) {
      return store.has(key) ? store.get(key) : null;
    }
    async set(key: string, value: unknown) {
      store.set(key, value);
    }
  }
  return { Redis: FakeRedis };
});

import { GET as configRoute } from "@/app/api/config/route";
import { POST as createRoute } from "@/app/api/rooms/route";
import { GET as pollRoute } from "@/app/api/rooms/[code]/route";
import { POST as advanceRoute } from "@/app/api/rooms/[code]/advance/route";
import { POST as joinRoute } from "@/app/api/rooms/[code]/join/route";
import { POST as voteRoute } from "@/app/api/rooms/[code]/vote/route";

function postJson(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  store.clear();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

describe("/api/config", () => {
  it("reports enabled when Redis env vars are set", async () => {
    const res = await configRoute();
    expect(await res.json()).toEqual({ onlineEnabled: true });
  });

  it("reports disabled when Redis env vars are missing", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const res = await configRoute();
    expect(await res.json()).toEqual({ onlineEnabled: false });
  });
});

describe("room routes wiring", () => {
  it("404s every route when online mode is disabled", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const res = await createRoute(
      postJson("http://x/api/rooms", { hostName: "Ana", totalRounds: 10 })
    );
    expect(res.status).toBe(404);
  });

  it("400s room creation on invalid input", async () => {
    const res = await createRoute(
      postJson("http://x/api/rooms", { hostName: "", totalRounds: 10 })
    );
    expect(res.status).toBe(400);
  });

  it("supports the full create -> join -> poll -> vote flow", async () => {
    const createRes = await createRoute(
      postJson("http://x/api/rooms", { hostName: "Ana", totalRounds: 10 })
    );
    expect(createRes.status).toBe(200);
    const { code, token: hostToken } = await createRes.json();
    expect(code).toMatch(/^[A-Z]{4}$/);

    const joinRes = await joinRoute(
      postJson(`http://x/api/rooms/${code}/join`, { name: "Luis" }),
      { params: { code } }
    );
    expect(joinRes.status).toBe(200);
    const { token: guestToken } = await joinRes.json();

    const pollRes = await pollRoute(
      new Request(`http://x/api/rooms/${code}?token=${hostToken}`),
      { params: { code } }
    );
    expect(pollRes.status).toBe(200);
    const hostView = await pollRes.json();
    expect(hostView.phase).toBe("voting");
    expect(hostView.players).toEqual(["Ana", "Luis"]);

    // Wrong/unknown token is rejected, not leaked as a 200.
    const badPoll = await pollRoute(
      new Request(`http://x/api/rooms/${code}?token=nope`),
      { params: { code } }
    );
    expect(badPoll.status).toBe(404);

    const voteRes = await voteRoute(
      postJson(`http://x/api/rooms/${code}/vote`, { token: hostToken, vote: 0 }),
      { params: { code } }
    );
    expect(voteRes.status).toBe(200);
    expect((await voteRes.json()).phase).toBe("voting"); // still waiting on guest

    // A token that isn't part of this room cannot vote on someone's behalf.
    const forbiddenVote = await voteRoute(
      postJson(`http://x/api/rooms/${code}/vote`, { token: "intruder", vote: 1 }),
      { params: { code } }
    );
    expect(forbiddenVote.status).toBe(403);

    const secondVoteRes = await voteRoute(
      postJson(`http://x/api/rooms/${code}/vote`, { token: guestToken, vote: 0 }),
      { params: { code } }
    );
    const revealed = await secondVoteRes.json();
    expect(revealed.phase).toBe("reveal");
    expect(revealed.votes).toEqual([0, 0]);

    const advanceRes = await advanceRoute(
      postJson(`http://x/api/rooms/${code}/advance`, { token: hostToken }),
      { params: { code } }
    );
    expect((await advanceRes.json()).currentRound).toBe(2);
  });

  it("404s joining a room that doesn't exist", async () => {
    const res = await joinRoute(
      postJson("http://x/api/rooms/ZZZZ/join", { name: "Luis" }),
      { params: { code: "ZZZZ" } }
    );
    expect(res.status).toBe(404);
  });
});
