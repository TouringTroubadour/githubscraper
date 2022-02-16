import GitHubScraper from "@troubadour/githubscraper";

getGithubData();

async function getGithubData() {
  const GitHubAPI = new GitHubScraper("GET_API_KEY_FROM_GITHUB");

  const results = await GitHubAPI.getList(
    "USERNAME/REPOSITORY",
    "https://api.github.com/repos/USERNAME/REPOSITORY/tags"
  );

  console.log(results.length);

  console.log(results);

  await GitHubAPI.downloadList("./Results/", results);

  console.log("Internal Ratelimit Information:");
  console.log(GitHubAPI.getInternalRateLimitInformation());
}
