const NO_STORE = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function unavailable(status, message) {
  return new Response(message, {
    status,
    headers: { ...NO_STORE, "content-type": "text/plain; charset=utf-8" },
  });
}

function dashboardOrigin(value) {
  const origin = new URL(String(value ?? "").trim());
  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("Invalid dashboard upstream origin.");
  }
  return origin.origin;
}

/**
 * Forward only /manage requests to the separately hosted RemBot runtime.
 * OAuth secrets remain on the bot host; the Pages Function stores no session
 * or token data and passes cookies/redirects through unchanged.
 */
export async function proxyRemDashboard(context) {
  const { request, env } = context;
  const incoming = new URL(request.url);

  if (incoming.pathname !== "/manage" && !incoming.pathname.startsWith("/manage/")) {
    return unavailable(404, "Not found.");
  }

  let origin;
  try {
    origin = dashboardOrigin(env?.REMBOT_DASHBOARD_UPSTREAM_ORIGIN);
  } catch {
    return unavailable(503, "The management panel proxy is not configured.");
  }

  const target = new URL(incoming.pathname + incoming.search, origin);
  const headers = new Headers(request.headers);

  // Do not forward client-supplied host/forwarding metadata to the bot.
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  headers.delete("x-forwarded-for");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.slice(0, -1));
  headers.set("cache-control", "no-store");

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  try {
    const upstreamRequest = new Request(target.toString(), init);
    const upstreamResponse = await fetch(upstreamRequest);
    const responseHeaders = new Headers(upstreamResponse.headers);
    const cookies = typeof upstreamResponse.headers.getSetCookie === "function"
      ? upstreamResponse.headers.getSetCookie()
      : typeof upstreamResponse.headers.getAll === "function"
        ? upstreamResponse.headers.getAll("set-cookie")
        : [];
    if (cookies.length > 0) {
      responseHeaders.delete("set-cookie");
      for (const cookie of cookies) responseHeaders.append("set-cookie", cookie);
    }
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("x-content-type-options", "nosniff");

    // Preserve status, Location, every Set-Cookie value and the streamed response body.
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    return unavailable(502, "The management panel is temporarily unavailable.");
  }
}
