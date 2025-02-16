"use server"

import { createClient } from "@/db/supabase/server"

export async function getUserMetrics() {
  const db = await createClient()
  const { data, error } = await db.rpc("get_user_metrics")

  if (error) {
    console.error("Error fetching user metrics:", error)
    throw error
  }

  return data
}

export async function getProductMetrics() {
  const db = await createClient()
  const { data, error } = await db.rpc("get_product_metrics")

  if (error) {
    console.error("Error fetching product metrics:", error)
    throw error
  }

  return data
}

export async function getCategoryMetrics() {
  const db = await createClient()
  const { data, error } = await db.rpc("get_category_metrics")

  if (error) {
    console.error("Error fetching category metrics:", error)
    throw error
  }

  return data
}

export async function getLabelMetrics() {
  const db = await createClient()
  const { data, error } = await db.rpc("get_label_metrics")

  if (error) {
    console.error("Error fetching label metrics:", error)
    throw error
  }

  return data
}

export async function getTagMetrics() {
  const db = await createClient()
  const { data, error } = await db.rpc("get_tag_metrics")

  if (error) {
    console.error("Error fetching tag metrics:", error)
    throw error
  }

  return data
}
