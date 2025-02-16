# Stage 2 - Enrichment

This document provides a technical breakdown of the files involved in a project designed for data enrichment using AI models. The project uses various AI models to enrich raw data items with additional metadata such as tags, labels, categories, codenames, punchlines, and descriptions.

## File: `ai-client.ts`

### Purpose

Defines the configuration and creation of AI clients for interacting with different AI providers, such as OpenAI and Anthropic. It also provides a method to generate structured data based on a given prompt and schema.

### Key Components

#### Types and Interfaces

- **AIModel**: Union type representing different AI models.
- **AIClientConfig**: Interface for the AI client configuration, including provider, model, and API key.

#### Functions

- **createAIClient**: Creates an AI client based on the provided configuration.
- **generate**: A generic function that generates structured data using the specified schema and prompt.

### Example

```typescript
const createAIClient = (config: AIClientConfig) => {
  const { provider, model, apiKey } = config
  const client =
    provider === "anthropic"
      ? createAnthropic({ apiKey })
      : createOpenAI({ apiKey })

  const generate = async <T>(
    schema: z.ZodSchema<T>,
    prompt: string
  ): Promise<GenerateObjectResult<T>> => {
    return generateObject({
      model: client(model),
      schema,
      prompt,
    })
  }

  return { generate }
}
```

## File: `enrichment.ts`

### Purpose

Provides functions to enrich raw data items using AI models. It includes throttling and retry mechanisms to handle API rate limits and retries for failed attempts.

### Key Components

#### Variables

- **claude3HaikuCalls**: Counter for tracking API calls to the `claude-3-haiku` model.
- **claude3SonnetCalls**: Counter for tracking API calls to the `claude-3-sonnet` model.

#### Functions

- **cleanAndJoinContent**: Cleans and joins content into sentences.
- **enrichItem**: Enriches a single raw data item using a specified AI client.
- **enrichData**: Main enrichment function that uses throttling and retry mechanisms.
- **enrichItemWithSeparateRequests**: Enriches an item using separate requests for details and filters.
- **enrichItemWithFixPrompt**: Enriches an item using a fix prompt.
- **enrichItemWithFallbackModel**: Enriches an item using a fallback model.

### Example

```typescript
const enrichData = (throttleLimit = 7, retryAttempts = 3) => {
  const throttle = pThrottle({ limit: throttleLimit, interval: 10000 })

  return throttle(async (item: RawDataItem): Promise<EnrichedDataItem> => {
    return pRetry(
      async (attempt) => {
        console.log(
          `Enriching item with ID: ${item.codename}, attempt: ${attempt}`
        )
        if (attempt === 1) {
          return await enrichItemWithSeparateRequests(item)
        } else if (attempt === 2) {
          const sonnetClient = createAIClient(sonnetConfig)
          return await enrichItemWithFixPrompt(sonnetClient, item)
        } else {
          const sonnetClient = createAIClient(sonnetConfig)
          return await enrichItemWithFallbackModel(sonnetClient, item)
        }
      },
      { retries: retryAttempts }
    )
  })
}
```

## File: `index.ts`

### Purpose

Manages the overall enrichment process, including loading environment variables, finding the latest raw data file, processing raw data, and saving the enriched data.

### Key Components

#### Functions

- **findLatestRawDataFile**: Finds the latest raw data file in the `__data__` directory.
- **processRawData**: Processes and enriches raw data items.
- **saveRawData**: Saves data to a JSON file.
- **enrichLatestData**: Main function to enrich the latest raw data.

### Example

```typescript
const processRawData = async (data: RawDataItem[], version: string) => {
  console.log("Starting data enrichment process...")
  const enrichedData: EnrichedDataItem[] = []
  const failedData: RawDataItem[] = []

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

  await saveRawData(enrichedData, version, "enriched")
  if (failedData.length > 0) {
    await saveRawData(failedData, version, "failed-enriched")
  }

  console.log("Data enrichment complete!")
}
```

## File: `prompts.ts`

### Purpose

Defines various prompts used for interacting with AI models to enrich raw data items. These prompts guide the AI models in generating the desired metadata.

### Key Components

#### Enums and Arrays

- **categoriesEnum**: Enum for different categories.
- **labelsEnum**: Enum for different labels organized by category.
- **allowedLabels**: Array of all allowed labels.
- **tagsEnum**: Array of all allowed tags.

#### Functions

- **prepareContent**: Cleans and prepares content by removing extra spaces and optionally splitting into sentences.
- **getSimpleDetailsPrompt**: Generates a prompt for enriching product details.
- **getSimpleTagsLabelsCategoriesPrompt**: Generates a prompt for enriching tags, labels, and categories.
- **fixLabelsTagsPrompt**: Generates a prompt for fixing labels and tags.
- **getAIEnrichmentPrompt**: Generates a comprehensive enrichment prompt.
- **getFixPrompt**: Generates a prompt for fixing errors in the enrichment process.

### Example

```typescript
export const getSimpleDetailsPrompt = (
  name: string,
  desc: string,
  content: string
) => {
  let prompt = `
    # Objective
    Enrich the following product with relevant category, codename, punchline, and description.
    ...
    - Input
    Site Name: "${name}"
    Site Description: "${desc}"`

  if (content) {
    prompt += `
    Site Content: "${prepareContent(content.substring(0, 300))}"`
  }

  prompt += `
    - Output`

  return prompt
}
```

## File: `schemas.ts`

### Purpose

Defines Zod schemas for validating the structure of raw and enriched data items.

### Key Components

#### Schemas

- **strictSchema**: Schema for validating enriched data with strict rules.
- **definitionSchema**: Schema for validating basic definitions such as codename, punchline, and description.
- **filtersSchema**: Schema for validating filters, accepting any string values for tags and labels.
- **filtersSchemaWithFixedLabelsSchema**: Schema for validating filters with fixed labels.
- **validateLabelsFiltersSchema**: Schema for validating tags and labels.

#### Interfaces

- **RawDataItem**: Interface representing the structure of a raw data item.
- **EnrichedDataItem**: Interface extending `RawDataItem` with additional fields for tags, labels, and categories.

### Example

```typescript
export const strictSchema = z.object({
  category: z.enum(categoriesEnum),
  tags: z.array(z.enum(tagsEnum)).max(4),
  labels: z
    .array(
      z.enum([
        ...labelsEnum.dev,
        ...labelsEnum.design,
        ...labelsEnum.learning,
        ...labelsEnum.media,
      ])
    )
    .max(3),
  codename: z.string(),
  punchline: z.string(),
  description: z.string(),
})
```

### Interfaces

```typescript
export interface RawDataItem {
  full_name: string
  product_website: string
  codename: string
  logo_src: string
  punchline: string
  description: string
  site_content: string
}

export interface EnrichedDataItem extends RawDataItem {
  tags: string[]
  labels: string[]
  categories: string
}
```

---

This breakdown provides an overview of each file's purpose, key components, and example snippets to illustrate their functionality. This should help in understanding how the different parts of the project work together to achieve data enrichment using AI models.
