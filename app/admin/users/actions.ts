"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/db/supabase/server"

// Update user full name
export async function updateUser(id: string, full_name: string) {
  const db = await createClient()
  const { error } = await db.from("users").update({ full_name }).eq("id", id)

  if (error) {
    console.error("Error updating user:", error)
    throw error
  }
  revalidatePath("/user-dashboard")

  return { id, full_name }
}

// Update user billing address
export async function updateBillingAddress(
  id: string,
  billing_address: object
) {
  const db = await createClient()
  const { error } = await db
    .from("users")
    .update({ billing_address })
    .eq("id", id)

  if (error) {
    console.error("Error updating billing address:", error)
    throw error
  }
  revalidatePath("/user-dashboard")

  return { id, billing_address }
}

// Update user payment method
export async function updatePaymentMethod(id: string, payment_method: object) {
  const db = await createClient()
  const { error } = await db
    .from("users")
    .update({ payment_method })
    .eq("id", id)

  if (error) {
    console.error("Error updating payment method:", error)
    throw error
  }
  revalidatePath("/user-dashboard")

  return { id, payment_method }
}

// Fetch user details
export async function fetchUserDetails(id: string) {
  const db = await createClient()
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching user details:", error)
    throw error
  }

  return data
}
