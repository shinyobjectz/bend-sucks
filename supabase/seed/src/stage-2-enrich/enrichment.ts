import path from "path"
import dotenv from "dotenv"
import pRetry from "p-retry"
import pThrottle from "p-throttle"

import { AIClientConfig, AIModel, createAIClient } from "./ai-client"
import {
  allowedLabels,
  fixLabelsTagsPrompt,
  getAIEnrichmentPrompt,
  getFixPrompt,
  getSimpleDetailsPrompt,
  getSimpleTagsLabelsCategoriesPrompt,
  tagsEnum,
} from "./prompt"
import {
  EnrichedDataItem,
  RawDataItem,
  definitionSchema,
  filtersSchema,
  filtersSchemaWithFixedLabelsSchema,
  strictSchema,
  validateLabelsFiltersSchema,
} from "./schemas"

dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") })

// Export counters for model calls to track usage
export let cheapFastModelCalls = 0
export let smartModelCalls = 0

const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim()
const openaiApiKey = process.env.OPENAI_API_KEY?.trim()

const cheapFastModelConfig: AIClientConfig = {
  provider: anthropicApiKey ? "anthropic" : "openai",
  model: anthropicApiKey
    ? ("claude-3-haiku-20240307" as AIModel)
    : ("gpt-3.5-turbo" as AIModel),
  apiKey: anthropicApiKey || openaiApiKey!,
}

const smartModelConfig: AIClientConfig = {
  provider: anthropicApiKey ? "anthropic" : "openai",
  model: anthropicApiKey
    ? ("claude-3-sonnet-20240229" as AIModel)
    : ("gpt-4-turbo" as AIModel),
  apiKey: anthropicApiKey || openaiApiKey!,
}

const cheapFastModel = createAIClient(cheapFastModelConfig)
const smarterModel = createAIClient(smartModelConfig)

// Used if cheap model fails
const fallbackSmarterModel = createAIClient(smartModelConfig)

// Utility function to clean content and split it into sentences
const cleanAndJoinContent = (content: string): string => {
  const cleanedContent = content.replace(/\s\s+/g, " ").trim()
  const sentences = cleanedContent
    .split(". ")
    .map((sentence) => sentence.trim() + ".")
  return sentences.join(" ")
}

// Function to perform enrichment using a given AI model
const enrichItem = async (
  client: ReturnType<typeof createAIClient>,
  item: RawDataItem
): Promise<EnrichedDataItem> => {
  const result = await client.generate(
    strictSchema,
    getAIEnrichmentPrompt(item.codename, item.description, item.site_content)
  )

  return {
    ...item,
    codename: result.object.codename,
    punchline: result.object.punchline,
    description: result.object.description,
    tags: result.object.tags,
    labels: result.object.labels,
    categories: result.object.category,
  }
}

// Main enrichment function with throttling and retry mechanism
export const enrichData = (throttleLimit = 7, retryAttempts = 3) => {
  const throttle = pThrottle({ limit: throttleLimit, interval: 10000 }) // throttle 10 seconds every 7 requests

  // Function to enrich a single item with retry logic
  return throttle(async (item: RawDataItem): Promise<EnrichedDataItem> => {
    return pRetry(
      async (attempt) => {
        console.log(
          `Enriching item with ID: ${item.codename}, attempt: ${attempt}`
        )

        if (attempt === 1) {
          return await enrichItemWithSeparateRequests(item)
        } else if (attempt === 2) {
          return await enrichItemWithFixPrompt(fallbackSmarterModel, item)
        } else {
          return await enrichItemWithFallbackModel(fallbackSmarterModel, item)
        }
      },
      { retries: retryAttempts }
    )
  })
}

// Function to enrich an item using separate requests for details and filters
const enrichItemWithSeparateRequests = async (
  item: RawDataItem
): Promise<EnrichedDataItem> => {
  try {
    const [detailsOutput, filtersOutput] = await Promise.all([
      cheapFastModel.generate(
        definitionSchema,
        getSimpleDetailsPrompt(
          item.codename,
          item.description,
          cleanAndJoinContent(item.site_content)
        )
      ),
      cheapFastModel.generate(
        filtersSchema,
        getSimpleTagsLabelsCategoriesPrompt(
          item.codename,
          item.description,
          item.site_content
        )
      ),
    ])

    // Validate the filters output
    const validationResult = await validateLabelsFiltersSchema.safeParse({
      tags: filtersOutput.object.tags,
      labels: filtersOutput.object.labels,
    })

    // Initialize fixed labels and tags
    let fixedLabelsTags = {
      tags: filtersOutput.object.tags,
      labels: filtersOutput.object.labels,
    }

    // If validation fails, fix labels and tags
    if (!validationResult.success) {
      console.log("______________RUN 1 PASS - FIX LABELS TAGS_____________")
      const fixedLabelsTagsOutput = await smarterModel.generate(
        filtersSchemaWithFixedLabelsSchema,
        fixLabelsTagsPrompt(
          filtersOutput.object.tags,
          filtersOutput.object.labels
        )
      )
      fixedLabelsTags = fixedLabelsTagsOutput.object
      smartModelCalls += 1 // Increment the sonnet model call count by 1
    }

    // Ensure fixed labels and tags are not undefined
    if (!fixedLabelsTags || !fixedLabelsTags.tags || !fixedLabelsTags.labels) {
      throw new Error("Fixed labels or tags are undefined")
    }

    // Combine details and fixed labels/tags into a single output
    const combinedOutput = {
      codename: detailsOutput.object.codename,
      punchline: detailsOutput.object.punchline,
      description: detailsOutput.object.description,
      tags: fixedLabelsTags.tags
        .filter((tag: string) =>
          (tagsEnum as ReadonlyArray<string>).includes(tag)
        )
        .slice(0, 4),
      labels: fixedLabelsTags.labels
        .filter((label: string) =>
          (allowedLabels as ReadonlyArray<string>).includes(label)
        )
        .slice(0, 3),
      category: filtersOutput.object.category || "undefined", // Ensure category is not undefined
    }

    // Validate the combined output
    const strictValidation = await strictSchema.safeParse(combinedOutput)

    if (!strictValidation.success) {
      console.log(
        "______________RUN 1 COMBINED OUTPUT FAIL_____________",
        combinedOutput
      )
      throw new Error(
        `Failed to validate attempt 1 output for ${
          item.codename
        }: ${JSON.stringify(strictValidation.error.errors, null, 2)}`
      )
    }

    cheapFastModelCalls += 2 // Increment the haiku model call count by 2

    console.log("______________ RUN 1 PASS_____________")

    return {
      ...item,
      ...combinedOutput,
      categories: combinedOutput.category,
    }
  } catch (error) {
    console.error(`Failed attempt 1 for ${item.codename}:`, error)
    throw error
  }
}

// Function to enrich an item using a fix prompt
const enrichItemWithFixPrompt = async (
  client: ReturnType<typeof createAIClient>,
  item: RawDataItem
): Promise<EnrichedDataItem> => {
  try {
    // Generate a fix prompt for the AI model
    const fixPrompt = getFixPrompt(
      item.codename,
      item.description,
      item.site_content,
      {}
    )

    // Generate the result using the AI model
    const result = await client.generate(strictSchema, fixPrompt)
    cheapFastModelCalls += 1 // Increment the sonnet model call count by 1

    return {
      ...item,
      codename: result.object.codename,
      punchline: result.object.punchline,
      description: result.object.description,
      tags: result.object.tags,
      labels: result.object.labels,
      categories: result.object.category,
    }
  } catch (error) {
    console.error(`Failed attempt 2 for ${item.codename}:`, error)
    throw error
  }
}

// Function to enrich an item using a fallback model
const enrichItemWithFallbackModel = async (
  client: ReturnType<typeof createAIClient>,
  item: RawDataItem
): Promise<EnrichedDataItem> => {
  // Perform enrichment using the main function as a fallback
  const enrichedItem = await enrichItem(client, item)
  smartModelCalls += 1 // Increment the sonnet model call count by 1
  return enrichedItem
}
