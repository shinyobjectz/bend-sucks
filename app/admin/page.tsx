import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SupabaseIcon } from "@/components/ui/icons"

import {
  getCategoryMetrics,
  getLabelMetrics,
  getProductMetrics,
  getTagMetrics,
  getUserMetrics,
} from "./actions"
import { AnalyticsOverview } from "./overview"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [users, products, categories, labels, tags] = await Promise.allSettled([
    getUserMetrics(),
    getProductMetrics(),
    getCategoryMetrics(),
    getLabelMetrics(),
    getTagMetrics(),
  ])

  const userMetrics = users.status === "fulfilled" ? users.value : []
  const productMetrics = products.status === "fulfilled" ? products.value : []
  const categoryMetrics =
    categories.status === "fulfilled" ? categories.value : []
  const labelMetrics = labels.status === "fulfilled" ? labels.value : []
  const tagMetrics = tags.status === "fulfilled" ? tags.value : []

  return (
    <main className="sm:px-12 sm:pl-20 sm:py-0 p-4 space-y-12">
      <div className="flex flex-col items-start justify-center gap-2 ">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl md:text-5xl font-black ">Overview</h1>
          <Badge variant="outline">
            <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse mr-1"></span>
            growing
          </Badge>
        </div>
        <div className="flex flex-col items-start mt-4">
          <div className="flex items-center mt-2">
            <span className="mx-2 text-xl font-bold">
              Quickly view your own analytics
            </span>
          </div>
          <div className="flex  items-center gap-1">
            <SupabaseIcon className="size-7" />
            <p className="mt-2 text-left text-muted-foreground  text-pretty">
              No need to pay for expensive analytics tools. <br />
              All you need are and rpc functions.
            </p>
          </div>
        </div>
      </div>

      <AnalyticsOverview
        users={userMetrics}
        products={productMetrics}
        categories={categoryMetrics}
        labels={labelMetrics}
        tags={tagMetrics}
      />
    </main>
  )
}
