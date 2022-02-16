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

## License

### MIT License

#### Copyright (c) 2022 Troubadour

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
