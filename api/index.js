// @ts-check

import { renderStatsCard } from "../src/cards/stats.js";
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
import { fetchStats } from "../src/fetchers/stats.js";
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
    hide_rank,
    show_icons,
    include_all_commits,
    commits_year,
    line_height,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold,
    bg_color,
    theme,
    cache_seconds,
    exclude_repo,
    custom_title,
    locale,
    disable_animations,
    border_radius,
    number_format,
    number_precision,
    border_color,
    rank_icon,
    show,
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
      {
        status: 400,
        headers: { "Content-Type": "image/svg+xml" },
      },
    );
  }

  try {
    const showStats = parseArray(show);
    const stats = await fetchStats(
      username,
      parseBoolean(include_all_commits),
      parseArray(exclude_repo),
      showStats.includes("prs_merged") ||
        showStats.includes("prs_merged_percentage"),
      showStats.includes("discussions_started"),
      showStats.includes("discussions_answered"),
      parseInt(commits_year, 10),
      env,
    );
    const cacheSeconds = resolveCacheSeconds(
      {
        requested: parseInt(cache_seconds, 10),
        def: CACHE_TTL.STATS_CARD.DEFAULT,
        min: CACHE_TTL.STATS_CARD.MIN,
        max: CACHE_TTL.STATS_CARD.MAX,
      },
      env,
    );

    const cacheHeaders = getCacheHeaders(cacheSeconds, env);

    return new Response(
      renderStatsCard(stats, {
        hide: parseArray(hide),
        show_icons: parseBoolean(show_icons),
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        hide_rank: parseBoolean(hide_rank),
        include_all_commits: parseBoolean(include_all_commits),
        commits_year: parseInt(commits_year, 10),
        line_height,
        title_color,
        ring_color,
        icon_color,
        text_color,
        text_bold: parseBoolean(text_bold),
        bg_color,
        theme,
        custom_title,
        border_radius,
        border_color,
        number_format,
        number_precision: parseInt(number_precision, 10),
        locale: locale ? locale.toLowerCase() : null,
        disable_animations: parseBoolean(disable_animations),
        rank_icon,
        show: showStats,
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
