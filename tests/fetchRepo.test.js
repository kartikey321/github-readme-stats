import { afterEach, describe, expect, it, jest } from "@jest/globals";
import "@testing-library/jest-dom";
import { fetchRepo } from "../src/fetchers/repo.js";

const data_repo = {
  repository: {
    name: "convoychat",
    stargazers: { totalCount: 38000 },
    description: "Help us take over the world! React + TS + GraphQL Chat App",
    primaryLanguage: {
      color: "#2b7489",
      id: "MDg6TGFuZ3VhZ2UyODc=",
      name: "TypeScript",
    },
    forkCount: 100,
  },
};

const data_user = {
  data: {
    user: { repository: data_repo.repository },
    organization: null,
  },
};

const data_org = {
  data: {
    user: null,
    organization: { repository: data_repo.repository },
  },
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Test fetchRepo", () => {
  it("should fetch correct user repo", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_user,
      status: 200,
    }));

    let repo = await fetchRepo("kartikey321", "convoychat");

    expect(repo).toStrictEqual({
      ...data_repo.repository,
      starCount: data_repo.repository.stargazers.totalCount,
    });
  });

  it("should fetch correct org repo", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => data_org,
      status: 200,
    }));

    let repo = await fetchRepo("kartikey321", "convoychat");
    expect(repo).toStrictEqual({
      ...data_repo.repository,
      starCount: data_repo.repository.stargazers.totalCount,
    });
  });

  it("should throw error if user is found but repo is null", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({
        data: { user: { repository: null }, organization: null },
      }),
      status: 200,
    }));

    await expect(fetchRepo("kartikey321", "convoychat")).rejects.toThrow(
      "User Repository Not found",
    );
  });

  it("should throw error if org is found but repo is null", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({
        data: { user: null, organization: { repository: null } },
      }),
      status: 200,
    }));

    await expect(fetchRepo("kartikey321", "convoychat")).rejects.toThrow(
      "Organization Repository Not found",
    );
  });

  it("should throw error if both user & org data not found", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({ data: { user: null, organization: null } }),
      status: 200,
    }));

    await expect(fetchRepo("kartikey321", "convoychat")).rejects.toThrow(
      "Not found",
    );
  });

  it("should throw error if repository is private", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async () => ({
      json: async () => ({
        data: {
          user: { repository: { ...data_repo, isPrivate: true } },
          organization: null,
        },
      }),
      status: 200,
    }));

    await expect(fetchRepo("kartikey321", "convoychat")).rejects.toThrow(
      "User Repository Not found",
    );
  });
});
