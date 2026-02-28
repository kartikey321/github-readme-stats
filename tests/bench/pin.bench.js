import pin from "../../api/pin.js";
import { it, jest } from "@jest/globals";
import { runAndLogStats } from "./utils.js";

const data_repo = {
  repository: {
    username: "kartikey321",
    name: "convoychat",
    stargazers: {
      totalCount: 38000,
    },
    description: "Help us take over the world! React + TS + GraphQL Chat App",
    primaryLanguage: {
      color: "#2b7489",
      id: "MDg6TGFuZ3VhZ2UyODc=",
      name: "TypeScript",
    },
    forkCount: 100,
    isTemplate: false,
  },
};

const data_user = {
  data: {
    user: { repository: data_repo.repository },
    organization: null,
  },
};

jest.spyOn(global, "fetch").mockImplementation(async () => ({
  json: async () => data_user,
  status: 200,
}));

it("test /api/pin", async () => {
  await runAndLogStats("test /api/pin", async () => {
    const req = {
      query: {
        username: "kartikey321",
        repo: "convoychat",
      },
    };
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await pin(req, res);
  });
});
