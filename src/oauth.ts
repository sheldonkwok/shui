import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { Context } from "hono";
import { ALLOWED_EMAIL, setReturnTo, signValue, verifySignedValue } from "./auth.ts";

/**
 * A stateless OAuth 2.1 authorization server for the MCP endpoint. Shui has a single user, so there is
 * nothing to store: client IDs, authorization codes and tokens are all JSON payloads signed with
 * AUTH_SECRET (the same HMAC the session cookie uses). Signing in is the existing Google login.
 *
 * Trade-offs of being stateless: tokens cannot be revoked before they expire (rotate AUTH_SECRET to
 * invalidate them all) and an authorization code is not strictly single-use. PKCE and the 60 second
 * code lifetime make a stolen code useless.
 */

const CODE_TTL_SECONDS = 60;
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;

const CLAUDE_HOSTS = ["claude.ai", "claude.com"];
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

const now = () => Math.floor(Date.now() / 1000);

type Sealed = { typ: string; exp?: number } & Record<string, unknown>;

/** Sign a payload into an opaque URL-safe token. `typ` stops one kind of token being used as another. */
async function seal(typ: string, data: Record<string, unknown>, ttlSeconds?: number): Promise<string> {
  const payload: Sealed = { typ, ...data, ...(ttlSeconds ? { exp: now() + ttlSeconds } : {}) };
  return Buffer.from(await signValue(JSON.stringify(payload))).toString("base64url");
}

async function unseal<T extends Record<string, unknown>>(typ: string, token: string): Promise<T | null> {
  try {
    const value = await verifySignedValue(Buffer.from(token, "base64url").toString());
    if (!value) return null;
    const payload = JSON.parse(value) as Sealed;
    if (payload.typ !== typ) return null;
    if (payload.exp !== undefined && payload.exp < now()) return null;
    return payload as unknown as T;
  } catch {
    return null;
  }
}

/** Only Claude's own callback and local loopback clients (e.g. the CLI) may receive authorization codes. */
function isAllowedRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    if (url.protocol === "https:") return CLAUDE_HOSTS.includes(url.hostname);
    if (url.protocol === "http:") return LOOPBACK_HOSTS.includes(url.hostname);
  } catch {}
  return false;
}

/** A confidential client's secret is derived from its (signed) client ID, so it needs no storage either. */
async function deriveClientSecret(clientId: string): Promise<string> {
  const signature = (await signValue(`client-secret:${clientId}`)).split(".").pop() ?? "";
  return signature.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function clientFromId(clientId: string): Promise<OAuthClientInformationFull | undefined> {
  const payload = await unseal<{ meta: OAuthClientMetadata }>("client", clientId);
  if (!payload) return undefined;
  const { meta } = payload;
  if (!meta.redirect_uris.every(isAllowedRedirectUri)) return undefined;

  const isPublic = meta.token_endpoint_auth_method === "none";
  return {
    ...meta,
    client_id: clientId,
    ...(isPublic ? {} : { client_secret: await deriveClientSecret(clientId), client_secret_expires_at: 0 }),
  };
}

async function issueTokens(clientId: string, email: string, scopes: string[]): Promise<OAuthTokens> {
  const claims = { cid: clientId, email, scopes };
  return {
    access_token: await seal("access", claims, ACCESS_TTL_SECONDS),
    token_type: "Bearer",
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: await seal("refresh", claims, REFRESH_TTL_SECONDS),
    ...(scopes.length ? { scope: scopes.join(" ") } : {}),
  };
}

type Claims = { cid: string; email: string; scopes: string[]; exp: number };
type CodeClaims = Claims & { ruri: string; cc: string };

export type OAuthProviderOptions = {
  /** The signed-in user's email for this request, or null when they still need to sign in. */
  getEmail: (c: Context) => Promise<string | null>;
};

export function createOAuthProvider({ getEmail }: OAuthProviderOptions) {
  return {
    clientsStore: {
      getClient: clientFromId,
      registerClient: async (info: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">) => {
        const { client_secret: _s, client_secret_expires_at: _e, ...meta } = info;
        if (!meta.redirect_uris.every(isAllowedRedirectUri)) {
          throw new InvalidClientMetadataError("redirect_uris must be Claude callback URLs or loopback URLs");
        }
        const client = await clientFromId(await seal("client", { meta, nonce: crypto.randomUUID() }));
        if (!client) throw new InvalidClientMetadataError("Invalid client metadata");
        return { ...client, client_id_issued_at: now() };
      },
    },

    skipLocalPkceValidation: false,

    /** Sends a signed-out user through Google login first, then redirects back to the client with a code. */
    async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, c: Context) {
      const email = await getEmail(c);
      if (email !== ALLOWED_EMAIL) {
        const url = new URL(c.req.url);
        setReturnTo(c, url.pathname + url.search);
        c.res = c.redirect("/auth/google");
        return;
      }

      const code = await seal(
        "code",
        {
          cid: client.client_id,
          email,
          scopes: params.scopes ?? [],
          ruri: params.redirectUri,
          cc: params.codeChallenge,
        },
        CODE_TTL_SECONDS,
      );
      const redirect = new URL(params.redirectUri);
      redirect.searchParams.set("code", code);
      if (params.state) redirect.searchParams.set("state", params.state);
      c.res = c.redirect(redirect.href);
    },

    async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string) {
      const code = await unseal<CodeClaims>("code", authorizationCode);
      if (!code || code.cid !== client.client_id) throw new InvalidGrantError("Invalid authorization code");
      return code.cc;
    },

    async exchangeAuthorizationCode(
      client: OAuthClientInformationFull,
      authorizationCode: string,
      _codeVerifier?: string,
      redirectUri?: string,
    ) {
      const code = await unseal<CodeClaims>("code", authorizationCode);
      if (!code || code.cid !== client.client_id) throw new InvalidGrantError("Invalid authorization code");
      if (redirectUri && redirectUri !== code.ruri) throw new InvalidGrantError("redirect_uri mismatch");
      return issueTokens(client.client_id, code.email, code.scopes);
    },

    async exchangeRefreshToken(client: OAuthClientInformationFull, refreshToken: string) {
      const claims = await unseal<Claims>("refresh", refreshToken);
      if (!claims || claims.cid !== client.client_id) throw new InvalidGrantError("Invalid refresh token");
      return issueTokens(client.client_id, claims.email, claims.scopes);
    },

    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const claims = await unseal<Claims>("access", token);
      if (!claims || claims.email !== ALLOWED_EMAIL) throw new InvalidTokenError("Invalid or expired token");
      return {
        token,
        clientId: claims.cid,
        scopes: claims.scopes,
        expiresAt: claims.exp,
        extra: { email: claims.email },
      };
    },
  };
}
