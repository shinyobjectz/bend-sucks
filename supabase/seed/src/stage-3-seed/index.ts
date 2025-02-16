import fs from "fs"
import path from "path"
import { PostgrestError, createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

import { getPublicUrl, uploadImageFromUrl } from "./fetch-images"

dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") })

// PLACE YOUR ADMIN UUID HERE
const ADMIN_UUID_FOR_SEEDING = process.env.SUPABASE_ADMIN_ID

interface RawData {
  full_name: string
  product_website: string
  codename: string
  logo_src: string
  punchline: string
  description: string
  tags: string[]
  labels: string[]
  categories: string
}

interface FailedData extends RawData {
  error: string
}

interface SuccessfulData {
  view_count: number
  approved: boolean
  logo_src: string
  user_id: string
  full_name: string
  twitter_handle: string
  email: string
  codename: string
  punchline: string
  categories: string
  tags: string[]
  labels: string[]
  description: string
  product_website: string
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "" // Use a service role key to bypass RLS for admin actions
)

async function getOrCreateEntity(
  table: string,
  name: string,
  skipErrors: string[] = []
): Promise<string | null> {
  try {
    console.log(`Checking existence of ${name} in ${table} table`)
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("name", name)
      .single()

    if (data) {
      console.log(`${name} exists in ${table} table with ID: ${data.id}`)
      return data.id
    }

    console.log(`${name} does not exist in ${table} table. Creating new entry.`)
    const { data: newData, error: insertError } = await supabase
      .from(table)
      .insert({ name })
      .select("id")
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    console.log(`Created ${name} in ${table} table with ID: ${newData.id}`)
    return newData.id
  } catch (error) {
    if (skipErrors.includes((error as Error).message)) {
      console.warn(
        `Skipping error for ${name} in ${table}: ${(error as Error).message}`
      )
      return null
    } else {
      throw error
    }
  }
}

async function seedImagesAndProducts(rawData: RawData[]): Promise<void> {
  const placeholderFilePath = path.resolve(
    __dirname,
    "../../images/placeholder.png"
  )

  console.log("Starting image upload and data preparation...")
  const productData = await Promise.all(
    rawData.map(async (data, i) => {
      const fileName = `seed-${data.codename}-${i}-logo.png`

      try {
        const uploadedFileName = await uploadImageFromUrl(
          "product-logos",
          data.logo_src,
          fileName,
          placeholderFilePath
        )

        const logoUrl = await getPublicUrl("product-logos", uploadedFileName)

        console.log(`Processing labels for product: ${data.codename}`)
        await Promise.all(
          data.labels.map(
            async (label) =>
              await getOrCreateEntity("labels", label, ["duplicate key value"])
          )
        )
        console.log(`Processing tags for product: ${data.codename}`)
        await Promise.all(
          data.tags.map(
            async (tag) =>
              await getOrCreateEntity("tags", tag, ["duplicate key value"])
          )
        )
        await getOrCreateEntity("categories", data.categories)

        console.log(`Prepared data for product: ${data.codename}`)
        return {
          view_count: 0,
          approved: true,
          logo_src: logoUrl,
          user_id: ADMIN_UUID_FOR_SEEDING,
          full_name: data.full_name,
          twitter_handle: "@nolansym",
          email: "contact@example.com",
          codename: data.codename,
          punchline: data.punchline,
          categories: data.categories,
          tags: data.tags,
          labels: data.labels,
          description: data.description,
          product_website: data.product_website,
        } as SuccessfulData
      } catch (err) {
        const error = err as Error | PostgrestError
        console.error(
          `Skipping product due to image upload failure: ${
            data.product_website
          }. Error: ${"message" in error ? error.message : "Unknown error"}`
        )
        return {
          ...data,
          error: "message" in error ? error.message : "Unknown error",
        } as FailedData
      }
    })
  )

  const successfulProducts = productData.filter(
    (product): product is SuccessfulData => !(product as FailedData).error
  )
  const failedProducts = productData.filter(
    (product): product is FailedData => !!(product as FailedData).error
  )

  // Remove duplicates within the batch by codename
  const uniqueProductData = Array.from(
    new Map(successfulProducts.map((item) => [item.codename, item])).values()
  )

  console.log("Starting data upsert into products table...")
  // Insert or update data in batches to improve performance
  const batchSize = 50
  for (let i = 0; i < uniqueProductData.length; i += batchSize) {
    const batch = uniqueProductData.slice(i, i + batchSize)
    const { error } = await supabase
      .from("products")
      .upsert(batch as any, { onConflict: "codename" })

    if (error) {
      console.error(
        "Error upserting products batch:",
        (error as PostgrestError).message
      )
    } else {
      console.log(`Successfully upserted batch ${i / batchSize + 1}`)
    }
  }

  // Write failed seedings to a file
  const failedSeedFilePath = path.resolve(
    __dirname,
    "__data__/failed-seed.json"
  )
  fs.writeFileSync(failedSeedFilePath, JSON.stringify(failedProducts, null, 2))

  console.log(
    `Seeding completed. Successfully seeded: ${successfulProducts.length}. Failed: ${failedProducts.length}.`
  )
}

const findLatestEnrichedDataFile = async (): Promise<string> => {
  const dataDir = path.join(__dirname, "../stage-2-enrich/__data__")

  console.log("Finding the latest enriched data file...")
  try {
    const files = await fs.promises.readdir(dataDir)
    const enrichedFiles = files.filter(
      (file) => file.startsWith("enriched-") && file.endsWith(".json")
    )
    enrichedFiles.sort()
    const latestFile =
      enrichedFiles.length > 0 ? enrichedFiles[enrichedFiles.length - 1] : ""
    if (latestFile) {
      console.log(`Latest enriched data file found: ${latestFile}`)
    } else {
      console.error("No enriched data files found")
    }
    return latestFile
  } catch (error) {
    console.error(
      "Error finding latest enriched data file:",
      (error as Error).message
    )
    return ""
  }
}

// Main function to seed the database
export const seedDatabase = async () => {
  console.log("Starting database seed process...")

  const latestEnrichedDataFile = await findLatestEnrichedDataFile()

  if (!latestEnrichedDataFile) {
    console.error("No enriched data files found. Aborting seed process.")
    return
  }

  const rawDataFilePath = path.join(
    __dirname,
    "../stage-2-enrich/__data__",
    latestEnrichedDataFile
  )
  console.log(`Reading raw data from file: ${rawDataFilePath}`)
  const rawData: RawData[] = JSON.parse(
    fs.readFileSync(rawDataFilePath, "utf-8")
  )

  await seedImagesAndProducts(rawData)
  console.log("Database seed process completed.")
}
