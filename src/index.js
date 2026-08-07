export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (response.ok) {
      const isDocument = url.pathname.endsWith("/") || url.pathname.endsWith(".html");
      headers.set(
        "Cache-Control",
        isDocument ? "public, max-age=300" : "public, max-age=31536000, immutable",
      );
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
