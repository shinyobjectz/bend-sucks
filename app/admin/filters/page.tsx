import { createClient } from "@/db/supabase/server"
import { BoxIcon, Hash, TagIcon, TicketPercent } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { AdminTable } from "./table"

export const dynamic = "force-dynamic"

async function fetchItems(table: string) {
  const db = await createClient()
  const { data, error } = await db.from(table).select("*")

  if (error) {
    console.error(`Error fetching ${table}:`, error)
    return []
  }
  return data
}

export default async function AdminFiltersDashboard() {
  const categories = await fetchItems("categories")
  const labels = await fetchItems("labels")
  const tags = await fetchItems("tags")

  return (
    <main className="flex items-center justify-center flex-col gap-4 p-4 sm:px-12 sm:pl-20 sm:py-0 md:gap-8">
      <div className="flex gap-8 items-center justify-start w-full">
        <div className="flex flex-col items-start justify-center gap-2 ">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl md:text-5xl font-black ">Filters</h1>
            <Badge variant="outline">
              <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse mr-1"></span>
              {labels?.length + tags?.length + categories?.length} filters
            </Badge>
          </div>
          <div className="flex flex-col items-start mt-4">
            <div className="flex items-center mt-2">
              <span className="mx-2 text-xl font-bold">
                Filters show up on the product sidebar
              </span>
            </div>
            <p className="mt-2 text-left text-muted-foreground">
              Use the sync filters button to update <br /> new products tags,
              labels, and categories
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-4 w-full">
        <Card className="col-span-1 md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <BoxIcon className="size-7 bg-neutral-900 stroke-yellow-300 p-1.5 rounded-full" />{" "}
              Categories
            </CardTitle>
            <CardDescription>
              Manage category information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <AdminTable items={categories} itemType="category" />
            ) : (
              <div>No categories found</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <TagIcon className="size-7 bg-neutral-900 stroke-yellow-300 p-1.5 rounded-full" />{" "}
              Tags
            </CardTitle>
            <CardDescription>
              Manage tag information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tags.length > 0 ? (
              <AdminTable items={tags} itemType="tag" />
            ) : (
              <div>No tags found</div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <Hash className="size-7 bg-neutral-900 stroke-yellow-300 p-1.5 rounded-full" />{" "}
              Labels
            </CardTitle>
            <CardDescription>
              Manage label information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {labels.length > 0 ? (
              <AdminTable items={labels} itemType="label" />
            ) : (
              <div>No labels found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
