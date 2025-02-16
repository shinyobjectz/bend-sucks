// prompts.ts
export const categoriesEnum = ["dev", "design", "learning", "media"] as const
export const labelsEnum = {
  dev: ["frontend", "backend", "devops", "ui"] as const,
  design: [
    "ui",
    "graphic",
    "systems",
    "kits",
    "icons",
    "gradients",
    "tools",
    "typography",
    "fonts",
    "patterns",
    "showcases",
  ] as const,
  learning: [
    "courses",
    "tutorials",
    "blogs",
    "articles",
    "studies",
    "docs",
    "references",
  ] as const,
  media: ["stock", "images", "videos", "editing"] as const,
}
export const allowedLabels = [
  ...labelsEnum.dev,
  ...labelsEnum.design,
  ...labelsEnum.learning,
  ...labelsEnum.media,
]
export const tagsEnum = [
  "libraries",
  "frameworks",
  "components",
  "state",
  "databases",
  "api",
  "ci/cd",
  "deployment",
  "monitoring",
  "design systems",
  "ui kits",
  "icons",
  "gradients",
  "tools",
  "reactjs",
  "nextjs",
  "tailwindcss",
  "figma",
] as const

const prepareContent = (content: string) => {
  // Remove extra spaces
  let cleanedContent = content.replace(/\s\s+/g, " ").trim()
  // Optionally, split into sentences or sections if needed
  let sentences = cleanedContent
    .split(". ")
    .map((sentence) => sentence.trim() + ".")
  // Join sentences back together if you want a single string output
  cleanedContent = sentences.join(" ")
  return cleanedContent
}

export const getSimpleDetailsPrompt = (
  name: string,
  desc: string,
  content: string
) => {
  let prompt = `
   # Objective
  Enrich the following product with relevant category, codename, punchline, and description.
  
  # Examples
  Example 1:
  - Input
  Site Name: "PixelPerfect"
  Site Description: "A comprehensive design tool for creating pixel-perfect UI components and prototypes."
  Site Content: "PixelPerfect - Design stunning UIs - Create precise prototypes - Perfect your design workflow"
  - Output
  {
    "category": "design"
    "codename": "Pixel Perfect UI"
    "punchline": "Perfect Your Pixels"
    "description": "A comprehensive design tool for creating pixel-perfect UI components and prototypes, enhancing your design workflow with precision."
  }
  
  ### Definitions
  Categories (broad):
  - ${JSON.stringify(categoriesEnum)}
  Codename: A concise and memorable name for the product.
  Punchline: A short, catchy phrase that encapsulates the product's value proposition.
  Description: A brief explanation of the product, highlighting its key features and benefits.
  
  - Input
  Site Name: "${name}"
  Site Description: "${desc}"`

  if (content) {
    prompt += `
  Site Content: "${prepareContent(content.substring(0, 300))}"`
  }

  prompt += `
  - Output
  `

  return prompt
}

export const getSimpleTagsLabelsCategoriesPrompt = (
  name: string,
  desc: string,
  content: string
) => {
  let prompt = `
    # Objective
    Enrich the following product with relevant tags, labels, category..

    ## Examples
    Example 1:
    - Input
    Site Name: "PixelPerfect"
    Site Description: "A comprehensive design tool for creating pixel-perfect UI components and prototypes."
    Site Content: "PixelPerfect - Design stunning UIs - Create precise prototypes - Perfect your design workflow"
    - Output
    {
      "category": "design"
      "labels": ["ui", "tools"]
      "tags": ["design systems", "ui kits", "icons"]
    }

    ## Definitions
    CATEGORY OPTIONS:
    - ${JSON.stringify(categoriesEnum)}
    
    LABEL OPTIONS:
    - dev: ${JSON.stringify(labelsEnum.dev)}
    - design: ${JSON.stringify(labelsEnum.design)}
    - learning: ${JSON.stringify(labelsEnum.learning)}
    - media: ${JSON.stringify(labelsEnum.media)}
    
    TAG OPTIONS:
    - ${JSON.stringify(tagsEnum)}
    
    ## Instructions
    - Ensure all tags, labels, and category are lowercase.
    - Maximum of 3 tags, 2 labels, and 1 category.
    - Avoid inventing new options. ONLY USE the CATEGORY OPTIONS, LABEL OPTIONS, and TAG OPTIONS. 
    
    # Your Turn
    - Input
    Site Name: "${name}"
    Site Description: "${desc}"`

  if (content) {
    prompt += `
    Site Content: "${prepareContent(content.substring(0, 400))}"`
  }

  prompt += `
    - Output
    `

  return prompt
}

export const fixLabelsTagsPrompt = (labels: string[], tags: string[]) => {
  let prompt = `
    # Objective
    Revise the following labels and tags to match the LABEL AND TAG OPTIONS.
  
    LABEL OPTIONS: 
    - ${JSON.stringify(allowedLabels)}
    
    TAG OPTIONS:
    - ${JSON.stringify(tagsEnum)}

    # Input
    labels to fix: ${JSON.stringify(labels)}
    tags to fix: ${JSON.stringify(tags)}

    # Output
  `

  return prompt
}

export const getAIEnrichmentPrompt = (
  name: string,
  desc: string,
  content: string
) => {
  let prompt = `
  # Examples
  Example 1:
  - Input
  Site Name: "PixelPerfect"
  Site Description: "A comprehensive design tool for creating pixel-perfect UI components and prototypes."
  Site Content: "PixelPerfect - Design stunning UIs - Create precise prototypes - Perfect your design workflow"
  - Output
  {
    "category": "design"
    "labels": ["ui", "tools"]
    "tags": ["design systems", "ui kits", "icons"]
    "codename": "Pixel Perfect UI"
    "punchline": "Perfect Your Pixels"
    "description": "A comprehensive design tool for creating pixel-perfect UI components and prototypes, enhancing your design workflow with precision."
  }
  
  # Objective
  Enrich the following product with relevant tags, labels, category, codename, punchline, and description.
  
  ## Instructions
  - Ensure all tags, labels, and category are lowercase.
  - Maximum of 3 tags, 2 labels, and 1 category.
  - USE ONLY the provided options for Categories, Labels, and Tags:
  
  ### Definitions
  Categories (broad):
  - ${JSON.stringify(categoriesEnum)}
  
  Labels (less broad):
  - dev: ${JSON.stringify(labelsEnum.dev)}
  - design: ${JSON.stringify(labelsEnum.design)}
  - learning: ${JSON.stringify(labelsEnum.learning)}
  - media: ${JSON.stringify(labelsEnum.media)}
  
  Tags (lesser broad):
  - ${JSON.stringify(tagsEnum)}
  Codename: A concise and memorable name for the product.
  Punchline: A short, catchy phrase that encapsulates the product's value proposition.
  Description: A brief explanation of the product, highlighting its key features and benefits.
  
  - Input
  Site Name: "${name}"
  Site Description: "${desc}"`

  if (content) {
    prompt += `
  Site Content: "${prepareContent(content.substring(0, 400))}"`
  }

  prompt += `
  - Output
  `

  return prompt
}

export const getFixPrompt = (
  name: string,
  desc: string,
  content: string,
  failedOutput: any
) => {
  let prompt = `
    # Objective
    The previous attempt to enrich the product data failed with the following output:
    ${JSON.stringify(failedOutput, null, 2)}
    
    Please fix the specific errors in the failed output, particularly with the labels and tags, to generate a corrected response that matches the expected schema.
    
    ## Instructions  
    - Ensure all tags, labels, and category are lowercase and selected ONLY from the provided options.
    - Maximum of 3 tags, 2 labels, and 1 category.
    
    ### Definitions
    Categories (broad):
    - ${JSON.stringify(categoriesEnum)}
    
    Labels (less broad):
    - dev: ${JSON.stringify(labelsEnum.dev)}
    - design: ${JSON.stringify(labelsEnum.design)} 
    - learning: ${JSON.stringify(labelsEnum.learning)}
    - media: ${JSON.stringify(labelsEnum.media)}
    
    Tags (lesser broad):
    - ${JSON.stringify(tagsEnum)}
    Codename: A concise and memorable name for the product.
    Punchline: A short, catchy phrase that encapsulates the product's value proposition.
    Description: A brief explanation of the product, highlighting its key features and benefits.
    
    - Input  
    Site Name: "${name}"
    Site Description: "${desc}"`

  if (content) {
    prompt += `
    Site Content: "${content.substring(0, 400)}"`
  }

  prompt += `
    - Output
    `

  return prompt
}
