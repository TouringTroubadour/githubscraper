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

async function extractRepoVersions() {
  const ghs = new githubscraper(
    "API_KEY"
  );

  let url = "https://api.github.com/search/repositories?";
  let q = "q=" + encodeURIComponent("language:Java");
  let urlq = url + q + `&per_page=1&page=0`;

  const results = await ghs.getList(
    "https://api.github.com/repos/USERNAME/REPOSITORY/tags"
  );
  console.log(results);

  ghs.downloadList(results, "OUTPUT_FOLDER");
}

extractRepoVersions();

```
