// @ts-check

import { renderTopLanguages } from "../src/cards/top-languages.js";
import { guardAccess } from "../src/common/access.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  getCacheHeaders,
  getErrorCacheHeaders,
} from "../src/common/cache.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async (request, env) => {
  const url = new URL(request.url, "http://localhost");
  const query = Object.fromEntries(url.searchParams.entries());

  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    layout,
    langs_count,
    exclude_repo,
    size_weight,
    count_weight,
    custom_title,
    locale,
    border_radius,
    border_color,
    disable_animations,
    hide_progress,
    stats_format,
  } = query;

  const access = guardAccess({
    id: username,
    type: "username",
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
        secondaryMessage: "Locale not found",
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

  if (
    layout !== undefined &&
    (typeof layout !== "string" ||
      !["compact", "normal", "donut", "donut-vertical", "pie"].includes(layout))
  ) {
    return new Response(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect layout input",
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

  if (
    stats_format !== undefined &&
    (typeof stats_format !== "string" ||
      !["bytes", "percentages"].includes(stats_format))
  ) {
    return new Response(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Incorrect stats_format input",
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
    const topLangs = await fetchTopLanguages(
      username,
      parseArray(exclude_repo),
      size_weight,
      count_weight,
      env,
    );
    const cacheSeconds = resolveCacheSeconds(
      {
        requested: parseInt(cache_seconds, 10),
        def: CACHE_TTL.TOP_LANGS_CARD.DEFAULT,
        min: CACHE_TTL.TOP_LANGS_CARD.MIN,
        max: CACHE_TTL.TOP_LANGS_CARD.MAX,
      },
      env,
    );

    const cacheHeaders = getCacheHeaders(cacheSeconds, env);

    return new Response(
      renderTopLanguages(topLangs, {
        custom_title,
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide: parseArray(hide),
        title_color,
        text_color,
        bg_color,
        theme,
        layout,
        langs_count,
        border_radius,
        border_color,
        locale: locale ? locale.toLowerCase() : null,
        disable_animations: parseBoolean(disable_animations),
        hide_progress: parseBoolean(hide_progress),
        stats_format,
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
