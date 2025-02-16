"server-only"

// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

export async function updateProduct(id: string, approved: boolean) {
  const db = await createClient()
  const { data, error } = await db
    .from("products")
    .update({ approved })
    .eq("id", id)

  if (error) {
    console.error("Error updating product:", error)
    throw error
  }
  revalidatePath("/admin")

  return data
}

export async function deleteProduct(id: string) {
  const db = await createClient()
  const { error } = await db.from("products").delete().eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    throw error
  }
  revalidatePath("/admin")
}

export async function updateFilters() {
  const db = await createClient()
  const { data: categoriesData, error: categoriesError } = await db
    .from("products")
    .select("categories")

  const { data: labelsData, error: labelsError } = await db
    .from("products")
    .select("labels")

  const { data: tagsData, error: tagsError } = await db
    .from("products")
    .select("tags")

  if (categoriesError || labelsError || tagsError) {
    console.error(
      "Error fetching filters:",
      categoriesError,
      labelsError,
      tagsError
    )
    return
  }

  // Function to process and split comma-separated values
  const processValues = (values: any[]) => {
    try {
      return [
        ...new Set(
          values.flatMap((item) => {
            if (typeof item === "string") {
              return item.split(",").map((val) => val.trim())
            } else if (Array.isArray(item)) {
              return item.flatMap((val) =>
                val.split(",").map((v: string) => v.trim())
              )
            } else {
              console.error("Non-string item encountered:", item)
              return []
            }
          })
        ),
      ].filter((value) => value) // Filter out empty strings
    } catch (error) {
      console.error("Error processing values:", error)
      return []
    }
  }

  // Insert distinct categories into categories table
  const categories = processValues(
    categoriesData.map((item) => item.categories)
  )
  for (const category of categories) {
    if (category) {
      const { error } = await db
        .from("categories")
        .upsert({ name: category }, { onConflict: "name" })
      if (error) {
        console.error("Error upserting category:", error)
      }
    }
  }

  // Insert distinct labels into labels table
  const labels = processValues(labelsData.map((item) => item.labels))
  for (const label of labels) {
    if (label) {
      const { error } = await db
        .from("labels")
        .upsert({ name: label }, { onConflict: "name" })
      if (error) {
        console.error("Error upserting label:", error)
      }
    }
  }

  // Insert distinct tags into tags table
  const tags = processValues(tagsData.map((item) => item.tags))
  for (const tag of tags) {
    if (tag) {
      const { error } = await db
        .from("tags")
        .upsert({ name: tag }, { onConflict: "name" })
      if (error) {
        console.error("Error upserting tag:", error)
      }
    }
  }
}

// Function to approve all pending products
export async function approveAllPendingProducts() {
  const db = await createClient()
  const { data: pendingProducts, error } = await db
    .from("products")
    .select("id")
    .eq("approved", false)

  if (error) {
    console.error("Error fetching pending products:", error)
    throw error
  }

  const pendingProductIds = pendingProducts.map(
    (product: { id: string }) => product.id
  )

  const { error: updateError } = await db
    .from("products")
    .update({ approved: true })
    .in("id", pendingProductIds)

  if (updateError) {
    console.error("Error approving all pending products:", updateError)
    throw updateError
  }

  revalidatePath("/admin-dashboard")

  return pendingProductIds
}
