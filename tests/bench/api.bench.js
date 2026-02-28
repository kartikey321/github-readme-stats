import api from "../../api/index.js";
import { it, jest } from "@jest/globals";
import { runAndLogStats } from "./utils.js";

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
  rank: null,
};

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

const faker = (query, data) => {
  const req = new Request(
    `http://localhost/api?username=kartikey321&${new URLSearchParams(query).toString()}`,
  );
  const env = { PAT_1: "mocktoken" };

  let callCount = 0;
  jest.spyOn(global, "fetch").mockImplementation(async () => {
    callCount++;
    if (callCount === 1)
      return {
        ok: true,
        json: async () => data,
        status: 200,
        headers: new Map(),
      };
    return {
      ok: true,
      json: async () => data,
      status: 200,
      headers: new Map(),
    };
  });

  return { req, env };
};

it("test /api", async () => {
  await runAndLogStats("test /api", async () => {
    const { req, env } = faker({}, data_stats);
    await api(req, env);
  });
});
