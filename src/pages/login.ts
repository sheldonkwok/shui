import type { APIRoute } from "astro";
import { WorkOS } from "@workos-inc/node";

const clientId = process.env["WORKOS_CLIENT_ID"]!;
const workos = new WorkOS(process.env["WORKOS_API_KEY"], { clientId });

export const GET: APIRoute = async ({ request, redirect }) => {
  const provider = "GoogleOAuth";
  const url = new URL(request.url);
  const redirectUri =
    process.env["NODE_ENV"] === "production"
      ? `https://${url.host}/callback`
      : "http://localhost:4321/callback";

  const authorizationUrl = workos.sso.getAuthorizationUrl({
    provider,
    redirectUri,
    clientId,
  });

  return redirect(authorizationUrl);
};