# Stage 1 - Crawler

This document provides a detailed breakdown of a web crawler script that uses Crawlee, Puppeteer, and Puppeteer Extra to scrape data from web pages, handle retries for failed requests, and save the scraped data in JSON format.

## Key Features

- **Stealth Plugin**: Uses Puppeteer Extra's stealth plugin to avoid detection.
- **Data Extraction**: Scrapes titles, descriptions, images, and headings (h1, h2, h3) from web pages.
- **Retry Mechanism**: Implements a custom retry mechanism for failed requests.
- **Data Storage**: Saves scraped data in JSON format in a relative directory.
- **Concurrency**: Supports configurable concurrency for efficient data scraping.

## Script Overview

### Imports and Setup

```javascript
import path from "path"
import { Dataset, PuppeteerCrawler, PuppeteerCrawlingContext } from "crawlee"
import fs from "fs-extra"
import puppeteerExtra from "puppeteer-extra"
import stealthPlugin from "puppeteer-extra-plugin-stealth"
```

- **path**: Node.js module for handling and transforming file paths.
- **Dataset**: Crawlee class for managing structured data storage.
- **PuppeteerCrawler**: Crawlee class for managing the Puppeteer crawler.
- **PuppeteerCrawlingContext**: Context object passed to request handlers.
- **fs-extra**: Module for file system operations with additional features.
- **puppeteer-extra**: Extends Puppeteer with plugins.
- **stealthPlugin**: Plugin to avoid detection by anti-bot systems.

### Environment Variable Setup

```javascript
process.env.CRAWLEE_STORAGE_DIR = path.join(__dirname, "storage")
```

- Sets the `CRAWLEE_STORAGE_DIR` environment variable to a relative path (`./storage`).

### Stealth Plugin Usage

```javascript
puppeteerExtra.use(stealthPlugin())
```

- Configures Puppeteer Extra to use the stealth plugin.

### saveRawData Function

```javascript
const saveRawData = async (data, version) => {
  const filePath = path.join(__dirname, "__data__", `raw-${version}.json`)

  try {
    await fs.writeJson(filePath, data, { spaces: 2 })
    console.log(`Raw data successfully saved to ${filePath}`)
  } catch (error) {
    console.error(`Error saving raw data to ${filePath}:`, error)
  }
}
```

- **Parameters**: `data` (array of scraped data), `version` (string representing the version).
- **Functionality**: Saves the scraped data to a JSON file in the `__data__` directory.
- **Error Handling**: Logs an error message if the save operation fails.

### failedRequestHandler Function

```javascript
const failedRequestHandler = async ({ request, error, log }) => {
  log.error(`Request ${request.url} failed with error:`, error)

  if (request.retryCount < 3) {
    log.info(
      `Retrying request ${request.url} (attempt ${request.retryCount + 1})`
    )
    await crawler.addRequests([request])
  } else {
    log.error(
      `Request ${request.url} failed after ${request.retryCount} retries`
    )
  }
}
```

- **Parameters**: `request`, `error`, `log` (context object properties).
- **Functionality**: Logs errors and retries requests up to 3 times.

### Crawler Instance

```javascript
const crawler = new PuppeteerCrawler({
  launchContext: {
    launcher: puppeteerExtra,
    launchOptions: {
      headless: true,
    },
  },
  maxConcurrency: 20,
  async requestHandler({ request, page, log }) {
    log.info(`Processing ${request.url}...`)

    const title = await page.title()
    const description =
      (await page.$eval("meta[name='description']", (el) =>
        el.getAttribute("content")
      )) || "No Description"
    const codename = title.replace(/\s+/g, "-").toLowerCase()

    let logo_src =
      (await page.$eval("meta[property='og:image']", (el) =>
        el.getAttribute("content")
      )) ||
      (await page.$eval("meta[name='twitter:image']", (el) =>
        el.getAttribute("content")
      )) ||
      (await page.$eval("img", (el) => el.getAttribute("src"))) ||
      "./icon.png"

    if (!logo_src.startsWith("http")) {
      logo_src = new URL(logo_src, request.url).toString()
    }

    const h1s = await page.$$eval("h1", (elements) =>
      elements.map((el) => el.textContent).filter((text) => text)
    )
    const h2s = await page.$$eval("h2", (elements) =>
      elements.map((el) => el.textContent).filter((text) => text)
    )
    const h3s = await page.$$eval("h3", (elements) =>
      elements.map((el) => el.textContent).filter((text) => text)
    )

    const site_content = [...h1s, ...h2s, ...h3s].join(" ")

    const rawDataItem = {
      full_name: "seed-admin-user",
      product_website: request.url,
      codename: codename,
      logo_src: logo_src,
      punchline: title,
      description: description.substring(0, 500),
      site_content: site_content,
    }

    log.info(`Scraped data from ${request.url}:`, rawDataItem)

    await Dataset.pushData(rawDataItem)
  },
  failedRequestHandler,
})
```

- **launchContext**: Configures Puppeteer Extra as the launcher with headless mode enabled.
- **maxConcurrency**: Sets the maximum concurrency to 20.
- **requestHandler**: Defines the main scraping logic and data extraction.
- **failedRequestHandler**: Handles failed requests and retries.

### crawlAndSave Function

```javascript
export const crawlAndSave = async (startUrls) => {
  const version = new Date().toISOString().replace(/[:-]/g, "").split(".")[0]

  try {
    console.info(`Starting crawler with ${startUrls.length} start URLs`)
    await crawler.addRequests(startUrls)

    console.info("Running crawler...")
    await crawler.run()

    const { items } = await Dataset.getData()

    console.info(`Crawler finished. Scraped ${items.length} items`)

    await saveRawData(items, version)
    console.info("Raw data saved successfully")
  } catch (error) {
    console.error("Error during crawling:", error)
  }
}
```

- **Parameters**: `startUrls` (array of URLs to start crawling from).
- **Functionality**: Starts the crawler, runs it, retrieves the scraped data, and saves it using `saveRawData`.
- **Error Handling**: Logs errors that occur during the crawling process.

## Usage

### Running the Crawler

To run the crawler, import and call the `crawlAndSave` function with the desired start URLs:

```javascript
import { crawlAndSave } from "./crawler"

const startUrls = ["https://example.com", "https://another-example.com"]

crawlAndSave(startUrls)
```

### Example

Create a script (e.g., `index.js`) and use the `crawlAndSave` function:

```javascript
import { crawlAndSave } from "./crawler"

const startUrls = ["https://example.com", "https://another-example.com"]

crawlAndSave(startUrls)
```

Run the script:

```bash
node index.js
```

## Storage Directory

The `CRAWLEE_STORAGE_DIR` environment variable is set to `./storage` relative to the current script directory. All crawled data and logs are stored in this directory.

## Cleaning Up Storage

You can purge the default storage directories before starting the crawler if needed:

```javascript
import { purgeDefaultStorages } from "crawlee"

await purgeDefaultStorages()
```

This will clean up the storage directories except for the `INPUT` key in the default key-value store.
