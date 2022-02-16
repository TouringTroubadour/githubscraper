import GitHubScraper from "@troubadour/githubscraper";

// Downloads All Release Versions of a selected GitHub Repository
async function extractRepoVersions() {
  // Create new instance of GitHubScraper using GitHub API Key
  const ghs = new GitHubScraper("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");

  // Get List of Available Release Versions
  const results = await ghs.getList(
    "https://api.github.com/repos/bencevans/sonos-cli/tags"
  );

  // Print List of Results to console
  console.log(results);

  // Download List of Results
  ghs.downloadList(results, "C:/Users/Mann/Desktop/Results/");
}

extractRepoVersions();
