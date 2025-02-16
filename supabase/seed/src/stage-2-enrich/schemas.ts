// schemas.ts
import { z } from "zod"

import { categoriesEnum, labelsEnum, tagsEnum } from "./prompt"

// Define Zod schemas for validation
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

export const definitionSchema = z.object({
  codename: z.string(),
  punchline: z.string(),
  description: z.string(),
})

export const filtersSchema = z.object({
  category: z.enum(categoriesEnum),
  tags: z.array(z.string()), // Accept any string values for tags
  labels: z.array(z.string()), // Accept any string values for labels
})

export const filtersSchemaWithFixedLabelsSchema = z.object({
  tags: z.array(z.string()), // Accept any string values for tags
  labels: z.array(z.string()), // Accept any string values for labels
})

export const validateLabelsFiltersSchema = z.object({
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
})

// Interfaces for raw and enriched data items
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

export type DefinitionSchema = z.infer<typeof definitionSchema>

export type FiltersSchema = z.infer<typeof filtersSchema>
