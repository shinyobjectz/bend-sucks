// index.ts

import path from "path"
import dotenv from "dotenv"
import fs from "fs-extra"
import pMap from "p-map"

import { cheapFastModelCalls, enrichData, smartModelCalls } from "./enrichment"
import { EnrichedDataItem, RawDataItem } from "./schemas"

// Load environment variables from .env.local file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") })

// Initialize the enrichment function with the AI client
const enrich = enrichData()

// Function to find the latest raw data file in the __data__ directory
const findLatestRawDataFile = async (): Promise<string> => {
  const dataDir = path.join(__dirname, "../stage-1-crawl/__data__")

  try {
    const files = await fs.promises.readdir(dataDir)
    const rawFiles = files.filter(
      (file) => file.startsWith("raw-") && file.endsWith(".json")
    )
    rawFiles.sort()
    return rawFiles.length > 0 ? rawFiles[rawFiles.length - 1] : ""
  } catch (error) {
    console.error("Error finding latest raw data file:", error)
    return ""
  }
}

// Function to process and enrich raw data
const processRawData = async (data: RawDataItem[], version: string) => {
  console.log("Starting data enrichment process...")

  const enrichedData: EnrichedDataItem[] = []
  const failedData: RawDataItem[] = []

  // Process each item with concurrency limit
  await pMap(
    data,
    async (item) => {
      try {
        const enrichedItem = await enrich(item)
        enrichedData.push(enrichedItem)
      } catch (error) {
        console.error(`Failed to enrich data for ${item.codename}:`, error)
        failedData.push(item)
      }
    },
    { concurrency: 2 }
  )

  // Save enriched and failed data
  await saveRawData(enrichedData, version, "enriched")
  if (failedData.length > 0) {
    await saveRawData(failedData, version, "failed-enriched")
  }

  console.log("Data enrichment complete!")
  console.log("___________ENRICH RESULTS____________")
  console.log("RAW DATA COUNT:", data.length)
  console.log("ENRICHED DATA COUNT:", enrichedData.length)
  console.log("FAILED DATA COUNT:", failedData.length)
}

// Function to save data to a JSON file
const saveRawData = async (data: any[], version: string, type: string) => {
  const filePath = path.join(__dirname, `/__data__/${type}-${version}.json`)

  try {
    await fs.writeJson(filePath, data, { spaces: 2 })
    console.log(`Data successfully saved to ${filePath}`)
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error)
  }
}

// Main function to enrich the latest raw data
export const enrichLatestData = async () => {
  try {
    const latestRawDataFile = await findLatestRawDataFile()

    if (!latestRawDataFile) {
      throw new Error("No raw data files found")
    }

    const rawData: RawDataItem[] = await fs.readJson(
      path.join(__dirname, "../stage-1-crawl/__data__", latestRawDataFile)
    )

    const version = new Date().toISOString().replace(/[:-]/g, "").split(".")[0]

    await processRawData(rawData, version)
    console.log("Enrichment completed!")

    console.log(
      "Total calls to claude-3-haiku or gpt-3.5-turbo:",
      cheapFastModelCalls
    )
    console.log(
      "Total calls to claude-3-sonnet or gpt-4-turbo:",
      smartModelCalls
    )
    console.log("Total model calls:", cheapFastModelCalls + smartModelCalls)
  } catch (error) {
    console.error("Error during data enrichment:", error)
  }
}
