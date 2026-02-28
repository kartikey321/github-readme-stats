import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { calculateRank } from "../src/calculateRank.js";
import { fetchStats } from "../src/fetchers/stats.js";

// Test parameters.
const data_stats = {
  data: {
    user: {
      name: "Kartikey Mahawar",
      repositoriesContributedTo: { totalCount: 61 },
      commits: {
        totalCommitContributions: 100,
      },
      reviews: {
        totalPullRequestReviewContributions: 50,
      },
      pullRequests: { totalCount: 300 },
      mergedPullRequests: { totalCount: 240 },
      openIssues: { totalCount: 100 },
      closedIssues: { totalCount: 100 },
      followers: { totalCount: 100 },
      repositoryDiscussions: { totalCount: 10 },
      repositoryDiscussionComments: { totalCount: 40 },
      repositories: {
        totalCount: 5,
        nodes: [
          { name: "test-repo-1", stargazers: { totalCount: 100 } },
          { name: "test-repo-2", stargazers: { totalCount: 100 } },
          { name: "test-repo-3", stargazers: { totalCount: 100 } },
        ],
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor",
        },
      },
    },
  },
};

const data_year2003 = JSON.parse(JSON.stringify(data_stats));
data_year2003.data.user.commits.totalCommitContributions = 428;

const data_without_pull_requests = {
  data: {
    user: {
      ...data_stats.data.user,
      pullRequests: { totalCount: 0 },
      mergedPullRequests: { totalCount: 0 },
    },
  },
};

const data_repo = {
  data: {
    user: {
      repositories: {
        nodes: [
          { name: "test-repo-4", stargazers: { totalCount: 50 } },
          { name: "test-repo-5", stargazers: { totalCount: 50 } },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "cursor",
        },
      },
    },
  },
};

const data_repo_zero_stars = {
  data: {
    user: {
      repositories: {
        nodes: [
          { name: "test-repo-1", stargazers: { totalCount: 100 } },
          { name: "test-repo-2", stargazers: { totalCount: 100 } },
          { name: "test-repo-3", stargazers: { totalCount: 100 } },
          { name: "test-repo-4", stargazers: { totalCount: 0 } },
          { name: "test-repo-5", stargazers: { totalCount: 0 } },
        ],
        pageInfo: {
          hasNextPage: true,
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
      message: "Could not resolve to a User with the login of 'noname'.",
    },
  ],
};

// Setup jest fetch mock

let currentEnv = { NODE_ENV: "test" };

beforeEach(() => {
  currentEnv = {
    NODE_ENV: "test",
    FETCH_MULTI_PAGE_STARS: "false",
    PAT_1: "token",
  }; // Set to `false` to fetch only one page of stars.

  jest.spyOn(global, "fetch").mockImplementation(async (url, options) => {
    let reqBody = options && options.body ? JSON.parse(options.body) : {};

    if (
      reqBody.variables &&
      reqBody.variables.startTime &&
      reqBody.variables.startTime.startsWith("2003")
    ) {
      return {
        json: async () => ({ data: data_year2003.data }),
        headers: new Map(),
        status: 200,
      };
    }

    let isTotalCommits =
      typeof options?.body === "string" &&
      options.body.includes("totalCommitContributions");

    // totalCommits API (Search)
    if (url.toString().includes("search/commits")) {
      return {
        json: async () => ({ total_count: 1000 }),
        headers: new Map(),
        status: 200,
      };
    }

    return {
      json: async () => ({
        data: JSON.parse(
          JSON.stringify(isTotalCommits ? data_stats.data : data_repo.data),
        ),
      }),
      headers: new Map(),
      status: 200,
    };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test fetchStats", () => {
  it("should fetch correct stats", async () => {
    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should stop fetching when there are repos with zero stars", async () => {
    // Re-mock to return stats then zero_stars
    let callCount = 0;
    jest.spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      return {
        json: async () => ({
          data: JSON.parse(
            JSON.stringify(
              callCount === 1 ? data_stats.data : data_repo_zero_stars.data,
            ),
          ),
        }),
        headers: new Map(),
        status: 200,
      };
    });

    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should throw error", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => error, // Error payload matches native graphql error roots
      headers: new Map(),
      status: 200,
    }));

    await expect(
      fetchStats(
        "kartikey321",
        false,
        [],
        false,
        false,
        false,
        undefined,
        currentEnv,
      ),
    ).rejects.toThrow(
      "Could not resolve to a User with the login of 'noname'.",
    );
  });

  it("should fetch total commits", async () => {
    // We already handled search/commits returning 1000 in the default mock
    // But we can be explicit here:

    jest.spyOn(global, "fetch").mockImplementation(async (url, options) => {
      if (url.toString().includes("search/commits")) {
        return { json: async () => ({ total_count: 1000 }), status: 200 };
      }
      return { json: async () => ({ data: data_stats.data }), status: 200 };
    });

    let stats = await fetchStats(
      "kartikey321",
      true,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: true,
      commits: 1000,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 1000,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should throw specific error when include_all_commits true and invalid username", async () => {
    expect(
      fetchStats(
        "asdf///---",
        true,
        [],
        false,
        false,
        false,
        undefined,
        currentEnv,
      ),
    ).rejects.toThrow(new Error("Invalid username provided."));
  });

  it("should throw specific error when include_all_commits true and API returns error", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (url, options) => {
      if (url.toString().includes("search/commits")) {
        return {
          json: async () => ({ error: "Some test error message" }),
          status: 200,
        };
      }
      return {
        json: async () => ({
          data: JSON.parse(JSON.stringify(data_stats.data)),
        }),
        status: 200,
      };
    });

    expect(
      fetchStats(
        "kartikey321",
        true,
        [],
        false,
        false,
        false,
        undefined,
        currentEnv,
      ),
    ).rejects.toThrow(new Error("Could not fetch total commits."));
  });

  it("should exclude stars of the `test-repo-1` repository", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (url, options) => {
      if (url.toString().includes("search/commits")) {
        return { json: async () => ({ total_count: 1000 }), status: 200 };
      }
      return { json: async () => ({ data: data_stats.data }), status: 200 };
    });

    let stats = await fetchStats(
      "kartikey321",
      true,
      ["test-repo-1"],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: true,
      commits: 1000,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 200,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 1000,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 200,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should fetch two pages of stars if 'FETCH_MULTI_PAGE_STARS' env variable is set to `true`", async () => {
    currentEnv.FETCH_MULTI_PAGE_STARS = "true";

    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 400,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 400,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should fetch one page of stars if 'FETCH_MULTI_PAGE_STARS' env variable is set to `false`", async () => {
    currentEnv.FETCH_MULTI_PAGE_STARS = "false";

    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should fetch one page of stars if 'FETCH_MULTI_PAGE_STARS' env variable is not set", async () => {
    currentEnv.FETCH_MULTI_PAGE_STARS = undefined;

    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should not fetch additional stats data when it not requested", async () => {
    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should fetch additional stats when it requested", async () => {
    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      true,
      true,
      true,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 240,
      mergedPRsPercentage: 80,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 10,
      totalDiscussionsAnswered: 40,
      rank,
    });
  });

  it("should get commits of provided year", async () => {
    let stats = await fetchStats(
      "kartikey321",
      false,
      [],
      false,
      false,
      false,
      2003,
      currentEnv,
    );

    const rank = calculateRank({
      all_commits: false,
      commits: 428,
      prs: 300,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 428,
      totalIssues: 200,
      totalPRs: 300,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });

  it("should return correct data when user don't have any pull requests", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        json: async () => ({
          data: JSON.parse(JSON.stringify(data_without_pull_requests.data)),
        }),
        status: 200,
      };
    });
    const stats = await fetchStats(
      "kartikey321",
      false,
      [],
      true,
      false,
      false,
      undefined,
      currentEnv,
    );
    const rank = calculateRank({
      all_commits: false,
      commits: 100,
      prs: 0,
      reviews: 50,
      issues: 200,
      repos: 5,
      stars: 300,
      followers: 100,
    });

    expect(stats).toStrictEqual({
      contributedTo: 61,
      name: "Kartikey Mahawar",
      totalCommits: 100,
      totalIssues: 200,
      totalPRs: 0,
      totalPRsMerged: 0,
      mergedPRsPercentage: 0,
      totalReviews: 50,
      totalStars: 300,
      totalDiscussionsStarted: 0,
      totalDiscussionsAnswered: 0,
      rank,
    });
  });
});
