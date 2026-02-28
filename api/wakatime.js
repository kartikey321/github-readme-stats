// @ts-check

import { renderWakatimeCard } from "../src/cards/wakatime.js";
import { renderError } from "../src/common/render.js";
import { fetchWakatimeStats } from "../src/fetchers/wakatime.js";
import { isLocaleAvailable } from "../src/translations.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  getCacheHeaders,
  getErrorCacheHeaders,
} from "../src/common/cache.js";
import { guardAccess } from "../src/common/access.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";

export default async (request, env) => {
  const url = new URL(request.url, "http://localhost");
  const query = Object.fromEntries(url.searchParams.entries());
  const {
    username,
    title_color,
    icon_color,
    hide_border,
    card_width,
    line_height,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    hide_title,
    hide_progress,
    custom_title,
    locale,
    layout,
    langs_count,
    hide,
    api_domain,
    border_radius,
    border_color,
    display_format,
    disable_animations,
  } = query;

  const access = guardAccess({
    id: username,
    type: "wakatime",
    colors: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
    env,
  });
  if (!access.isPassed) {
    return access.result;
  }

  if (locale && !isLocaleAvailable(locale)) {
    return new Response(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
        renderOptions: {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
        },
      }),
      { status: 400, headers: { "Content-Type": "image/svg+xml" } },
    );
  }

  try {
    const stats = await fetchWakatimeStats({ username, api_domain });
    const cacheSeconds = resolveCacheSeconds(
      {
        requested: parseInt(cache_seconds, 10),
        def: CACHE_TTL.WAKATIME_CARD.DEFAULT,
        min: CACHE_TTL.WAKATIME_CARD.MIN,
        max: CACHE_TTL.WAKATIME_CARD.MAX,
      },
      env,
    );

    const cacheHeaders = getCacheHeaders(cacheSeconds, env);

    return new Response(
      renderWakatimeCard(stats, {
        custom_title,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide: parseArray(hide),
        line_height,
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        hide_progress,
        border_radius,
        border_color,
        locale: locale ? locale.toLowerCase() : null,
        layout,
        langs_count,
        display_format,
        disable_animations: parseBoolean(disable_animations),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          ...cacheHeaders,
        },
      },
    );
  } catch (err) {
    const cacheHeaders = getErrorCacheHeaders(env);
    if (err instanceof Error) {
      return new Response(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            title_color,
            text_color,
            bg_color,
            border_color,
            theme,
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "image/svg+xml",
            ...cacheHeaders,
          },
        },
      );
    }
    return new Response(
      renderError({
        message: "An unknown error occurred",
        renderOptions: {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "image/svg+xml",
          ...cacheHeaders,
        },
      },
    );
  }
};
