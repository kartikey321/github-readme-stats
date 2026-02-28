// @ts-check
import statsCardHandler from "../api/index.js";
import topLangsCardHandler from "../api/top-langs.js";
import wakatimeCardHandler from "../api/wakatime.js";
import pinCardHandler from "../api/pin.js";
import gistCardHandler from "../api/gist.js";

/**
 * Handle incoming requests and route them to the appropriate handler.
 * @param {Request} request
 * @param {Record<string, any>} env
 * @param {any} ctx
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "");

  // Route request to the appropriate handler
  switch (pathname) {
    case "/api":
      return statsCardHandler(request, env);
    case "/api/top-langs":
      return topLangsCardHandler(request, env);
    case "/api/wakatime":
      return wakatimeCardHandler(request, env);
    case "/api/pin":
      return pinCardHandler(request, env);
    case "/api/gist":
      return gistCardHandler(request, env);
    default:
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
  }
}

export default {
  /**
   * Cloudflare Worker entrypoint
   * @param {Request} request
   * @param {Record<string, any>} env
   * @param {any} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({ error: "Internal Server Error", message: e.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
