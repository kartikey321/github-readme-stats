// @ts-check

import { renderRepoCard } from "../src/cards/repo.js";
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
import { parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchRepo } from "../src/fetchers/repo.js";
import { isLocaleAvailable } from "../src/translations.js";

export default async (request, env) => {
  const url = new URL(request.url, "http://localhost");
  const query = Object.fromEntries(url.searchParams.entries());
  const {
    username,
    repo,
    hide_border,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    show_owner,
    cache_seconds,
    locale,
    border_radius,
    border_color,
    description_lines_count,
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
    const repoData = await fetchRepo(username, repo, env);
    const cacheSeconds = resolveCacheSeconds(
      {
        requested: parseInt(cache_seconds, 10),
        def: CACHE_TTL.PIN_CARD.DEFAULT,
        min: CACHE_TTL.PIN_CARD.MIN,
        max: CACHE_TTL.PIN_CARD.MAX,
      },
      env,
    );

    const cacheHeaders = getCacheHeaders(cacheSeconds, env);

    return new Response(
      renderRepoCard(repoData, {
        hide_border: parseBoolean(hide_border),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        border_radius,
        border_color,
        show_owner: parseBoolean(show_owner),
        locale: locale ? locale.toLowerCase() : null,
        description_lines_count,
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
