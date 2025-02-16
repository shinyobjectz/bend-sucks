# Website Data Collection and Database Seeding

This script allows you to collect data from websites, enrich the collected data, and store it in a database. It consists of three main steps: Crawl, Enrich, and Seed.

## Prerequisites

Before running this script, make sure to follow the main README to set up Supabase.

Ensure you have the following environment variables set in your `.env.local` file:

```env
# Required for Anthropic API
ANTHROPIC_API_KEY=""

# Or required for OpenAI API
OPENAI_API_KEY=""

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
```

## Running the Script

To run the script, use the following command:

```bash
pnpm run enrich-seed
```

## Step 1: Crawl

The crawling step is implemented in the `crawlAndSave` function. Here's a breakdown of what it does:

1. **Crawler Initialization**:

   - Creates an instance of the `PuppeteerCrawler` class, responsible for crawling websites using Puppeteer, a headless Chrome browser.
   - Sets the `CRAWLEE_STORAGE_DIR` environment variable to ensure data is stored in a relative directory.

2. **Request Handler**:

   - Called for each URL to be crawled.
   - Scrapes data from the page, including the title, description, image source, and content from `h1`, `h2`, and `h3` tags.
   - Constructs an object with the scraped data and adds it to a dataset.

3. **Function Execution**:
   - The `crawlAndSave` function takes an array of start URLs, initializes the crawler, and starts the crawling process.
   - Once the crawling is complete, the scraped data is retrieved from the dataset and saved to a JSON file using the `saveRawData` function.

## Step 2: Enrich

The enrichment step is implemented in the `enrichLatestData` function. Here's a breakdown of what it does:

1. **Find Latest Raw Data**:

   - Uses the `findLatestRawDataFile` function to locate the most recent raw data file.

2. **Process Raw Data**:

   - Reads the raw data from the file and processes each item using the `processRawData` function.
   - The `processRawData` function calls the `enrichData` function for each item.

3. **Data Enrichment**:

   - The `enrichData` function uses AI clients (OpenAI or Anthropic) to generate enriched data.
   - Sends a prompt to the AI API, which includes the item's codename, description, and prepared content. The API responds with additional data such as tags, labels, and categories.

4. **Save Enriched Data**:
   - The enriched data is saved to a JSON file using the `saveRawData` function.

## Step 3: Seed

The seeding step is implemented in the `seedDatabase` function. Here's a breakdown of what it does:

1. **Find Latest Enriched Data**:

   - Uses the `findLatestEnrichedDataFile` function to locate the most recent enriched data file.

2. **Process Enriched Data**:

   - Reads the enriched data from the file and processes each item using the `seedImagesAndProducts` function.

3. **Image Handling and Data Preparation**:

   - The `seedImagesAndProducts` function uploads the product logo image to a storage bucket using the `uploadImageFromUrl` function.
   - Retrieves the public URL of the uploaded image using the `getPublicUrl` function.
   - Creates or retrieves necessary entities (labels, tags, categories) using the `getOrCreateEntity` function.
   - Prepares the data for insertion into the `products` table.

4. **Database Upsert**:
   - The prepared data is upserted (inserted or updated) into the `products` table in batches using the Supabase client.

## Utility Functions

- **saveRawData(data: any[], version: string, type: string)**:

  - Saves the scraped or enriched data to a JSON file.
  - **Parameters**:
    - `data`: The data to be saved.
    - `version`: The version identifier for the data file.
    - `type`: The type of data being saved (e.g., "enriched", "failed-enriched").

- **findLatestRawDataFile()**:

  - Finds the latest raw data file in the `__data__` directory.

- **findLatestEnrichedDataFile()**:

  - Finds the latest enriched data file in the `__data__` directory.

- **uploadImageFromUrl(bucketName: string, url: string, filePathFileName: string, fallbackFilePath: string, retries: number = 3)**:

  - Uploads an image from a URL to a storage bucket.
  - **Parameters**:
    - `bucketName`: The name of the storage bucket.
    - `url`: The URL of the image to be uploaded.
    - `filePathFileName`: The desired file path and name for the uploaded image.
    - `fallbackFilePath`: The file path of a fallback image to be used if the upload fails.
    - `retries`: The number of retry attempts for uploading the image (default: 3).

- **getPublicUrl(bucketName: string, filePath: string)**:

  - Retrieves the public URL of a file in a storage bucket.
  - **Parameters**:
    - `bucketName`: The name of the storage bucket.
    - `filePath`: The file path of the image in the storage bucket.

- **getOrCreateEntity(table: string, name: string, skipErrors: string[] = [])**:
  - Creates or retrieves an entity (label, tag, category) from the database.
  - **Parameters**:
    - `table`: The name of the database table.
    - `name`: The name of the entity to create or retrieve.
    - `skipErrors`: An array of error messages to skip during creation.

By following these steps and utilizing the provided functions, the project collects data from websites, enriches it using AI models, and seeds the enriched data into a Supabase database. The project leverages libraries such as Puppeteer, Crawlee, and Supabase to accomplish these tasks efficiently.
