import { createHash, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ALLOWED_EMAIL } from "../auth.ts";
import { createMcpApp } from "./mcp.ts";

const REDIRECT_URI = "https://claude.ai/api/mcp/auth_callback";

const signedIn = createMcpApp({ getEmail: async () => ALLOWED_EMAIL });
const signedOut = createMcpApp({ getEmail: async () => null });

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } },
};

function callMcp(app: typeof signedIn, token?: string) {
  return app.request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(initialize),
  });
}

async function register(app: typeof signedIn, redirectUri = REDIRECT_URI) {
  return await app.request("http://localhost/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Claude",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

async function authorize(app: typeof signedIn, clientId: string, challenge: string) {
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: "xyz",
  });
  return await app.request(`http://localhost/authorize?${query}`);
}

function tokenRequest(app: typeof signedIn, params: Record<string, string>) {
  return app.request("http://localhost/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
}

async function signIn() {
  const client = (await (await register(signedIn)).json()) as { client_id: string; client_secret: string };
  const { verifier, challenge } = pkce();
  const res = await authorize(signedIn, client.client_id, challenge);
  const location = new URL(res.headers.get("location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  return { client, verifier, code, location };
}

describe("MCP OAuth", () => {
  it("challenges unauthenticated /mcp requests with the resource metadata URL", async () => {
    const res = await callMcp(signedIn);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain(
      'resource_metadata="http://localhost/.well-known/oauth-protected-resource/mcp"',
    );
  });

  it("publishes discovery metadata", async () => {
    const resource = await signedIn.request("http://localhost/.well-known/oauth-protected-resource/mcp");
    expect(await resource.json()).toMatchObject({
      resource: "http://localhost/mcp",
      authorization_servers: ["http://localhost"],
    });

    const server = await signedIn.request("http://localhost/.well-known/oauth-authorization-server");
    expect(await server.json()).toMatchObject({
      authorization_endpoint: "http://localhost/authorize",
      token_endpoint: "http://localhost/token",
      registration_endpoint: "http://localhost/register",
      code_challenge_methods_supported: ["S256"],
    });
  });

  it("only registers clients that redirect to Claude or loopback", async () => {
    expect((await register(signedIn)).status).toBe(201);
    expect((await register(signedIn, "http://127.0.0.1:8123/callback")).status).toBe(201);
    expect((await register(signedIn, "https://evil.example/callback")).status).toBe(400);
  });

  it("sends a signed-out user to Google login and remembers where to return", async () => {
    const client = (await (await register(signedOut)).json()) as { client_id: string };
    const res = await authorize(signedOut, client.client_id, pkce().challenge);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/auth/google");
    expect(res.headers.get("set-cookie")).toContain("auth_return=%2Fauthorize%3F");
  });

  it("runs the full flow: register, authorize, token, call /mcp, refresh", async () => {
    const { client, verifier, code, location } = await signIn();
    expect(location.origin + location.pathname).toBe(REDIRECT_URI);
    expect(location.searchParams.get("state")).toBe("xyz");

    const tokenRes = await tokenRequest(signedIn, {
      grant_type: "authorization_code",
      client_id: client.client_id,
      client_secret: client.client_secret,
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
    });
    expect(tokenRes.status).toBe(200);
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
    };
    expect(tokens.token_type).toBe("Bearer");

    expect((await callMcp(signedIn, tokens.access_token)).status).toBe(200);

    const refreshed = await tokenRequest(signedIn, {
      grant_type: "refresh_token",
      client_id: client.client_id,
      client_secret: client.client_secret,
      refresh_token: tokens.refresh_token,
    });
    expect(refreshed.status).toBe(200);
    const next = (await refreshed.json()) as { access_token: string };
    expect((await callMcp(signedIn, next.access_token)).status).toBe(200);
  });

  it("rejects a wrong PKCE verifier, a wrong client secret and a refresh token used as an access token", async () => {
    const { client, code } = await signIn();
    const base = { client_id: client.client_id, client_secret: client.client_secret };

    const badVerifier = await tokenRequest(signedIn, {
      ...base,
      grant_type: "authorization_code",
      code,
      code_verifier: pkce().verifier,
    });
    expect(badVerifier.status).toBe(400);

    const badSecret = await tokenRequest(signedIn, {
      ...base,
      client_secret: "nope",
      grant_type: "authorization_code",
      code,
      code_verifier: pkce().verifier,
    });
    expect(badSecret.status).toBe(400);

    const fresh = await signIn();
    const ok = await tokenRequest(signedIn, {
      client_id: fresh.client.client_id,
      client_secret: fresh.client.client_secret,
      grant_type: "authorization_code",
      code: fresh.code,
      code_verifier: fresh.verifier,
    });
    const tokens = (await ok.json()) as { access_token: string; refresh_token: string };
    expect((await callMcp(signedIn, tokens.refresh_token)).status).toBe(401);
    const middle = Math.floor(tokens.access_token.length / 2);
    const flipped = tokens.access_token[middle] === "A" ? "B" : "A";
    const tampered = tokens.access_token.slice(0, middle) + flipped + tokens.access_token.slice(middle + 1);
    expect((await callMcp(signedIn, tampered)).status).toBe(401);
  });

  it("rejects a code issued to a different client", async () => {
    const { code, verifier } = await signIn();
    const other = (await (await register(signedIn)).json()) as { client_id: string; client_secret: string };

    const res = await tokenRequest(signedIn, {
      client_id: other.client_id,
      client_secret: other.client_secret,
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
    });
    expect(res.status).toBe(400);
  });

  it("ignores MCP_API_KEY: only OAuth tokens are accepted", async () => {
    process.env.MCP_API_KEY = "static-key";
    try {
      expect((await callMcp(signedIn, "static-key")).status).toBe(401);
    } finally {
      delete process.env.MCP_API_KEY;
    }
  });
});
