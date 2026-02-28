// @ts-check

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import api from "../api/index.js";
import { calculateRank } from "../src/calculateRank.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderError } from "../src/common/render.js";
import { CACHE_TTL, DURATIONS } from "../src/common/cache.js";

/**
 * @type {import("../src/fetchers/stats").StatsData}
 */
const stats = {
  name: "Kartikey Mahawar",
  totalStars: 100,
  totalCommits: 200,
  totalIssues: 300,
  totalPRs: 400,
  totalPRsMerged: 320,
  mergedPRsPercentage: 80,
  totalReviews: 50,
  totalDiscussionsStarted: 10,
  totalDiscussionsAnswered: 40,
  contributedTo: 50,
  rank: { level: "DEV", percentile: 0 },
};

stats.rank = calculateRank({
  all_commits: false,
  commits: stats.totalCommits,
  prs: stats.totalPRs,
  reviews: stats.totalReviews,
  issues: stats.totalIssues,
  repos: 1,
  stars: stats.totalStars,
  followers: 0,
});

const data_stats = {
  data: {
    user: {
      name: stats.name,
      repositoriesContributedTo: { totalCount: stats.contributedTo },
      commits: {
        totalCommitContributions: stats.totalCommits,
      },
      reviews: {
        totalPullRequestReviewContributions: stats.totalReviews,
      },
      pullRequests: { totalCount: stats.totalPRs },
      mergedPullRequests: { totalCount: stats.totalPRsMerged },
      openIssues: { totalCount: stats.totalIssues },
      closedIssues: { totalCount: 0 },
      followers: { totalCount: 0 },
      repositoryDiscussions: { totalCount: stats.totalDiscussionsStarted },
      repositoryDiscussionComments: {
        totalCount: stats.totalDiscussionsAnswered,
      },
      repositories: {
        totalCount: 1,
        nodes: [{ stargazers: { totalCount: 100 } }],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor",
        },
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "Could not fetch user",
    },
  ],
};

// eslint-disable-next-line no-unused-vars
const faker = (query, data) => {
  const mergedQuery = {
    username: "kartikey321",
    ...query,
  };
  const url = new URL("http://localhost/api");
  for (const [k, v] of Object.entries(mergedQuery)) {
    url.searchParams.append(k, String(v));
  }
  const request = new Request(url.toString());

  let callCount = 0;
  jest.spyOn(global, "fetch").mockImplementation(async () => {
    callCount++;
    if (callCount === 1) return { json: async () => data, status: 200 };
    return { json: async () => data, status: 200 };
  });

  return { request, env: {}, query: mergedQuery };
};

beforeEach(() => {
  process.env.CACHE_SECONDS = undefined;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test /api/", () => {
  it("should test the request", async () => {
    const { request, env, query } = faker({}, data_stats);

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(renderStatsCard(stats, { ...query }));
  });

  it("should render error card on error", async () => {
    const { request, env, query } = faker({}, error);

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Make sure the provided username is not an organization",
      }),
    );
  });

  it("should render error card in same theme as requested card", async () => {
    const { request, env, query } = faker({ theme: "merko" }, error);

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: error.errors[0].message,
        secondaryMessage:
          "Make sure the provided username is not an organization",
        renderOptions: { theme: "merko" },
      }),
    );
  });

  it("should get the query options", async () => {
    const { request, env, query } = faker(
      {
        username: "kartikey321",
        hide: "issues,prs,contribs",
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      },
      data_stats,
    );

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderStatsCard(stats, {
        hide: ["issues", "prs", "contribs"],
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      }),
    );
  });

  it("should have proper cache", async () => {
    const { request, env, query } = faker({}, data_stats);

    const response = await api(request, env);

    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${CACHE_TTL.STATS_CARD.DEFAULT}, ` +
        `s-maxage=${CACHE_TTL.STATS_CARD.DEFAULT}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });

  it("should set proper cache", async () => {
    const cache_seconds = DURATIONS.TWELVE_HOURS;
    const { request, env, query } = faker({ cache_seconds }, data_stats);
    const response = await api(request, env);

    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${cache_seconds}, ` +
        `s-maxage=${cache_seconds}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });

  it("should set shorter cache when error", async () => {
    const { request, env, query } = faker({}, error);
    const response = await api(request, env);

    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${CACHE_TTL.ERROR}, ` +
        `s-maxage=${CACHE_TTL.ERROR}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });

  it("should properly set cache using CACHE_SECONDS env variable", async () => {
    const cacheSeconds = "10000";
    process.env.CACHE_SECONDS = cacheSeconds;

    const { request, env, query } = faker({}, data_stats);
    const response = await api(request, env);

    expect(response.headers.get("Cache-Control")).toBe(
      `max-age=${cacheSeconds}, ` +
        `s-maxage=${cacheSeconds}, ` +
        `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
    );
  });

  it("should disable cache when CACHE_SECONDS is set to 0", async () => {
    process.env.CACHE_SECONDS = "0";

    const { request, env, query } = faker({}, data_stats);
    const response = await api(request, env);

    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
    );
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
  });

  it("should set proper cache with clamped values", async () => {
    {
      let { request, env, query } = faker(
        { cache_seconds: 200_000 },
        data_stats,
      );
      const response = await api(request, env);

      expect(response.headers.get("Cache-Control")).toBe(
        `max-age=${CACHE_TTL.STATS_CARD.MAX}, ` +
          `s-maxage=${CACHE_TTL.STATS_CARD.MAX}, ` +
          `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
      );
    }

    // note i'm using block scoped vars
    {
      let { request, env, query } = faker({ cache_seconds: 0 }, data_stats);
      const response = await api(request, env);

      expect(response.headers.get("Cache-Control")).toBe(
        `max-age=${CACHE_TTL.STATS_CARD.MIN}, ` +
          `s-maxage=${CACHE_TTL.STATS_CARD.MIN}, ` +
          `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
      );
    }

    {
      let { request, env, query } = faker(
        { cache_seconds: -10_000 },
        data_stats,
      );
      const response = await api(request, env);

      expect(response.headers.get("Cache-Control")).toBe(
        `max-age=${CACHE_TTL.STATS_CARD.MIN}, ` +
          `s-maxage=${CACHE_TTL.STATS_CARD.MIN}, ` +
          `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
      );
    }
  });

  it("should allow changing ring_color", async () => {
    const { request, env, query } = faker(
      {
        username: "kartikey321",
        hide: "issues,prs,contribs",
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        ring_color: "0000ff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      },
      data_stats,
    );

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderStatsCard(stats, {
        hide: ["issues", "prs", "contribs"],
        show_icons: true,
        hide_border: true,
        line_height: 100,
        title_color: "fff",
        ring_color: "0000ff",
        icon_color: "fff",
        text_color: "fff",
        bg_color: "fff",
      }),
    );
  });

  it("should render error card if username in blacklist", async () => {
    const { request, env, query } = faker(
      { username: "renovate-bot" },
      data_stats,
    );

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "This username is blacklisted",
        secondaryMessage: "Please deploy your own instance",
        renderOptions: { show_repo_link: false },
      }),
    );
  });

  it("should render error card when wrong locale is provided", async () => {
    const { request, env, query } = faker({ locale: "asdf" }, data_stats);

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(await response.text()).toBe(
      renderError({
        message: "Something went wrong",
        secondaryMessage: "Language not found",
      }),
    );
  });

  it("should render error card when include_all_commits true and upstream API fails", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (url.toString().includes("search/commits")) {
        return {
          json: async () => ({ error: "Some test error message" }),
          status: 200,
        };
      }
      return { json: async () => data_stats, status: 200 };
    });

    const { request, env, query } = faker(
      { username: "kartikey321", include_all_commits: true },
      data_stats,
    );

    const response = await api(request, env);

    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    const body = await response.text();
    expect(body).toBe(
      renderError({
        message: "Could not fetch total commits.",
        secondaryMessage: "Please try again later",
      }),
    );
    // Received SVG output should not contain string "https://tiny.one/readme-stats"
    expect(body).not.toContain("https://tiny.one/readme-stats");
  });
});
