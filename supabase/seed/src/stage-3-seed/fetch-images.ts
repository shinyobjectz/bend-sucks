import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") })

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

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "" // Use a service role key to bypass RLS for admin actions
)

export async function uploadImageFromUrl(
  bucketName: string,
  url: string,
  filePathFileName: string,
  fallbackFilePath: string,
  retries: number = 3
): Promise<string> {
  let fileName = filePathFileName
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching image from URL: ${url}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}`)
      }

      const buffer = await response.arrayBuffer()
      console.log(
        `Uploading image to bucket: ${bucketName}, fileName: ${fileName}`
      )
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePathFileName, Buffer.from(buffer), {
          cacheControl: "3600",
          upsert: true,
        })

      if (error) {
        throw new Error(error.message)
      }

      console.log(`Successfully uploaded image from URL: ${url}`)
      return fileName
    } catch (err) {
      const error = err as Error
      console.error(
        `Attempt ${attempt} failed to fetch/upload image from URL: ${url}. Error: ${error.message}`
      )
      if (attempt === retries) {
        const fileBuffer = fs.readFileSync(fallbackFilePath)
        fileName = filePathFileName

        console.log(
          `Uploading placeholder image to bucket: ${bucketName}, fileName: ${fileName}`
        )
        const { error: fallbackError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileBuffer, {
            cacheControl: "3600",
            upsert: true,
          })

        if (fallbackError) {
          throw new Error(fallbackError.message)
        }

        console.log(`Successfully uploaded placeholder image for URL: ${url}`)
        return fileName
      }
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
  }
  throw new Error(
    `Failed to upload image from URL: ${url} after ${retries} attempts`
  )
}

export async function getPublicUrl(
  bucketName: string,
  filePath: string
): Promise<string> {
  console.log(
    `Getting public URL for filePath: ${filePath} in bucket: ${bucketName}`
  )
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
  if (!data) {
    throw new Error(`Failed to get public URL for filePath: ${filePath}`)
  }
  return data.publicUrl
}
