import path from "path"
import { Dataset, PuppeteerCrawler, PuppeteerCrawlingContext } from "crawlee"
import fs from "fs-extra"
import puppeteerExtra from "puppeteer-extra"
import stealthPlugin from "puppeteer-extra-plugin-stealth"

// Set CRAWLEE_STORAGE_DIR to a relative path
process.env.CRAWLEE_STORAGE_DIR = path.join(__dirname, "storage")

// Use the stealth plugin
puppeteerExtra.use(stealthPlugin())

// Function to save the scraped data
const saveRawData = async (data: any[], version: string) => {
  const filePath = path.join(__dirname, "__data__", `raw-${version}.json`)

  try {
    await fs.writeJson(filePath, data, { spaces: 2 })
    console.log(`Raw data successfully saved to ${filePath}`)
  } catch (error) {
    console.error(`Error saving raw data to ${filePath}:`, error)
  }
}

// Function to handle failed requests
const failedRequestHandler = async ({
  request,
  error,
  log,
}: PuppeteerCrawlingContext) => {
  // @ts-ignore
  log.error(`Request ${request.url} failed with error:`, error)

  // Implement a custom retry mechanism
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

// Create an instance of the PuppeteerCrawler class
const crawler = new PuppeteerCrawler({
  launchContext: {
    // Specify to use puppeteer-extra as the launcher
    launcher: puppeteerExtra,
    launchOptions: {
      headless: true,
    },
  },
  maxConcurrency: 20,
  async requestHandler({ request, page, log }) {
    log.info(`Processing ${request.url}...`)

    // Scrape the data
    const title = await page.title()
    const description =
      (await page.$eval("meta[name='description']", (el: Element) =>
        el.getAttribute("content")
      )) || "No Description"
    const codename = title.replace(/\s+/g, "-").toLowerCase()

    // Extract the image source
    let logo_src =
      (await page.$eval("meta[property='og:image']", (el: Element) =>
        el.getAttribute("content")
      )) ||
      (await page.$eval("meta[name='twitter:image']", (el: Element) =>
        el.getAttribute("content")
      )) ||
      (await page.$eval("img", (el: Element) => el.getAttribute("src"))) ||
      "./icon.png"

    // Make logo_src a relative URL if it starts with a dot
    if (!logo_src.startsWith("http")) {
      logo_src = new URL(logo_src, request.url).toString()
    }

    // Extract h1, h2, and h3 content
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

    // Add the scraped data to the dataset
    await Dataset.pushData(rawDataItem)
  },

  failedRequestHandler,
})

export const crawlAndSave = async (startUrls: string[]) => {
  const version = new Date().toISOString().replace(/[:-]/g, "").split(".")[0]

  try {
    console.info(`Starting crawler with ${startUrls.length} start URLs`)
    await crawler.addRequests(startUrls)

    console.info("Running crawler...")
    await crawler.run()

    // Retrieve the scraped data from the dataset
    const { items } = await Dataset.getData()

    console.info(`Crawler finished. Scraped ${items.length} items`)

    // Save all scraped data to a single file
    await saveRawData(items, version)
    console.info("Raw data saved successfully")
  } catch (error) {
    console.error("Error during crawling:", error)
  }
}

// import path from "path"
// import { Dataset, PuppeteerCrawler, PuppeteerCrawlingContext } from "crawlee"
// import fs from "fs-extra"
// import puppeteerExtra from "puppeteer-extra"
// import stealthPlugin from "puppeteer-extra-plugin-stealth"

// // Use the stealth plugin
// puppeteerExtra.use(stealthPlugin())

// // Function to save the scraped data
// const saveRawData = async (data: any[], version: string) => {
//   const filePath = path.join(__dirname, `__data__/raw-${version}.json`)

//   try {
//     await fs.writeJson(filePath, data, { spaces: 2 })
//     console.log(`Raw data successfully saved to ${filePath}`)
//   } catch (error) {
//     console.error(`Error saving raw data to ${filePath}:`, error)
//   }
// }

// // Function to handle failed requests
// const failedRequestHandler = async ({
//   request,
//   error,
//   log,
// }: PuppeteerCrawlingContext) => {
//   // @ts-ignore
//   log.error(`Request ${request.url} failed with error:`, error)

//   // Implement a custom retry mechanism
//   if (request.retryCount < 3) {
//     log.info(
//       `Retrying request ${request.url} (attempt ${request.retryCount + 1})`
//     )
//     await crawler.addRequests([request])
//   } else {
//     log.error(
//       `Request ${request.url} failed after ${request.retryCount} retries`
//     )
//   }
// }

// // Create an instance of the PuppeteerCrawler class
// const crawler = new PuppeteerCrawler({
//   launchContext: {
//     // Specify to use puppeteer-extra as the launcher
//     launcher: puppeteerExtra,
//     launchOptions: {
//       headless: true,
//     },
//   },
//   maxConcurrency: 20,
//   async requestHandler({ request, page, log }) {
//     log.info(`Processing ${request.url}...`)

//     // Scrape the data
//     const title = await page.title()
//     const description =
//       (await page.$eval("meta[name='description']", (el: Element) =>
//         el.getAttribute("content")
//       )) || "No Description"
//     const codename = title.replace(/\s+/g, "-").toLowerCase()

//     // Extract the image source
//     let logo_src =
//       (await page.$eval("meta[property='og:image']", (el: Element) =>
//         el.getAttribute("content")
//       )) ||
//       (await page.$eval("meta[name='twitter:image']", (el: Element) =>
//         el.getAttribute("content")
//       )) ||
//       (await page.$eval("img", (el: Element) => el.getAttribute("src"))) ||
//       "./icon.png"

//     // Make logo_src a relative URL if it starts with a dot
//     if (!logo_src.startsWith("http")) {
//       logo_src = new URL(logo_src, request.url).toString()
//     }

//     // Extract h1, h2, and h3 content
//     const h1s = await page.$$eval("h1", (elements) =>
//       elements.map((el) => el.textContent).filter((text) => text)
//     )
//     const h2s = await page.$$eval("h2", (elements) =>
//       elements.map((el) => el.textContent).filter((text) => text)
//     )
//     const h3s = await page.$$eval("h3", (elements) =>
//       elements.map((el) => el.textContent).filter((text) => text)
//     )

//     const site_content = [...h1s, ...h2s, ...h3s].join(" ")

//     const rawDataItem = {
//       full_name: "seed-admin-user",
//       product_website: request.url,
//       codename: codename,
//       logo_src: logo_src,
//       punchline: title,
//       description: description.substring(0, 500),
//       site_content: site_content,
//     }

//     log.info(`Scraped data from ${request.url}:`, rawDataItem)

//     // Add the scraped data to the dataset
//     await Dataset.pushData(rawDataItem)
//   },

//   failedRequestHandler,
// })

// export const crawlAndSave = async (startUrls: string[]) => {
//   const version = new Date().toISOString().replace(/[:-]/g, "").split(".")[0]

//   try {
//     console.info(`Starting crawler with ${startUrls.length} start URLs`)
//     await crawler.addRequests(startUrls)

//     console.info("Running crawler...")
//     await crawler.run()

//     // Retrieve the scraped data from the dataset
//     const { items } = await Dataset.getData()

//     console.info(`Crawler finished. Scraped ${items.length} items`)

//     // Save all scraped data to a single file
//     await saveRawData(items, version)
//     console.info("Raw data saved successfully")
//   } catch (error) {
//     console.error("Error during crawling:", error)
//   }
// }
