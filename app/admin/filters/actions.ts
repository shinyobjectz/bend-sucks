"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

export async function updateCategory(id: string, name: string, icon?: string) {
  const db = await createClient()
  const { error } = await db
    .from("categories")
    .update({ name, icon })
    .eq("id", id)

  if (error) {
    console.error("Error updating category:", error)
    throw error
  }
  revalidatePath("/category-label-tag-dashboard")

  return { id, name, icon }
}

export async function updateLabel(id: string, name: string) {
  const db = await createClient()
  const { error } = await db.from("labels").update({ name }).eq("id", id)

  if (error) {
    console.error("Error updating label:", error)
    throw error
  }
  revalidatePath("/category-label-tag-dashboard")

  return { id, name }
}

export async function updateTag(id: string, name: string) {
  const db = await createClient()
  const { error } = await db.from("tags").update({ name }).eq("id", id)

  if (error) {
    console.error("Error updating tag:", error)
    throw error
  }
  revalidatePath("/category-label-tag-dashboard")

  return { id, name }
}
