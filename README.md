# @troubadour/githubscraper

![npm](https://img.shields.io/badge/npm-v1.0.0-blue)
![license](https://img.shields.io/badge/license-MIT-important)

## Install

```md
npm install @troubadour/githubscraper
```

## Usage

```javascript
const githubscraper = require("@troubadour/githubscraper");

// Downloads All Release Versions of a selected GitHub Repository
async function extractRepoVersions() {
  // Create new instance of GitHubScraper using GitHub API Key
  const ghs = new GitHubScraper(
    "API_KEY"
  );

  // Get List of Available Release Versions
  const results = await ghs.getList(
    "https://api.github.com/repos/USERNAME/REPOSITORY/tags"
  );

  // Print List of Results to console
  console.log(results);

  // Download List of Results
  ghs.downloadList(results, "OUTPUT_FOLDER");
}

extractRepoVersions();

```
