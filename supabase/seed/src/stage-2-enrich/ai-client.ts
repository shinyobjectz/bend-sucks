import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { GenerateObjectResult, generateObject } from "ai"
import { z } from "zod"

export type AIModel =
  | "claude-3-haiku-20240307"
  | "claude-3-sonnet-20240229"
  | "gpt-3.5-turbo"
  | "gpt-4-turbo"
  | "gpt-4o"

export interface AIClientConfig {
  provider: "anthropic" | "openai"
  model: AIModel
  apiKey: string
}

export const createAIClient = (config: AIClientConfig) => {
  const { provider, model, apiKey } = config

  console.log("Creating AI client with config:", config.provider)

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
