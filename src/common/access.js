// @ts-check

import { renderError } from "./render.js";
import { blacklist } from "./blacklist.js";
import { getWhitelist, getGistWhitelist } from "./envs.js";

const NOT_WHITELISTED_USERNAME_MESSAGE = "This username is not whitelisted";
const NOT_WHITELISTED_GIST_MESSAGE = "This gist ID is not whitelisted";
const BLACKLISTED_MESSAGE = "This username is blacklisted";

/**
 * Guards access using whitelist/blacklist.
 *
 * @param {Object} args The parameters object.
 * @param {any} args.res The response object.
 * @param {string} args.id Resource identifier (username or gist id).
 * @param {"username"|"gist"|"wakatime"} args.type The type of identifier.
 * @param {{ title_color?: string, text_color?: string, bg_color?: string, border_color?: string, theme?: string }} args.colors Color options for the error card.
 * @param {Record<string, any>} [args.env] Environment variables.
 * @returns {{ isPassed: boolean, result?: any }} The result object indicating success or failure.
 */
const guardAccess = ({ res, id, type, colors, env = {} }) => {
  if (!["username", "gist", "wakatime"].includes(type)) {
    throw new Error(
      'Invalid type. Expected "username", "gist", or "wakatime".',
    );
  }

  const currentWhitelist =
    type === "gist" ? getGistWhitelist(env) : getWhitelist(env);
  const notWhitelistedMsg =
    type === "gist"
      ? NOT_WHITELISTED_GIST_MESSAGE
      : NOT_WHITELISTED_USERNAME_MESSAGE;

  if (Array.isArray(currentWhitelist) && !currentWhitelist.includes(id)) {
    const errorCard = renderError({
      message: notWhitelistedMsg,
      secondaryMessage: "Please deploy your own instance",
      renderOptions: {
        ...colors,
        show_repo_link: false,
      },
    });

    if (res && res.send) {
      return { isPassed: false, result: res.send(errorCard) };
    }
    return {
      isPassed: false,
      result: new Response(errorCard, {
        status: 401,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      }),
    };
  }

  if (
    type === "username" &&
    currentWhitelist === undefined &&
    blacklist.includes(id)
  ) {
    const errorCard = renderError({
      message: BLACKLISTED_MESSAGE,
      secondaryMessage: "Please deploy your own instance",
      renderOptions: {
        ...colors,
        show_repo_link: false,
      },
    });

    if (res && res.send) {
      return { isPassed: false, result: res.send(errorCard) };
    }
    return {
      isPassed: false,
      result: new Response(errorCard, {
        status: 403,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      }),
    };
  }

  return { isPassed: true };
};

export { guardAccess };
