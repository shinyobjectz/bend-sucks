import Link from "next/link"
import { createClient } from "@/db/supabase/server"
import {
  CirclePlusIcon,
  FileIcon,
  ListFilterIcon,
  PlugIcon,
  PlusIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SyncFiltersButton } from "./sync-filters-button"
import { AdminTable } from "./table"

export const dynamic = "force-dynamic"

function subMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

export default async function Page() {
  const db = await createClient()
  const { data: products } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  // Get the date one month ago
  const oneMonthAgo = subMonths(new Date(), 1)

  // Filter products based on status
  const approvedProducts = products?.filter((product) => product.approved)
  const pendingProducts = products?.filter((product) => !product.approved)
  const newProducts = products?.filter(
    (product) => new Date(product.created_at) >= oneMonthAgo
  )

  return (
    <main className="sm:px-12 sm:pl-20 sm:py-0 p-4 space-y-12">
      <div className="flex flex-col items-start justify-center gap-2 ">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl md:text-5xl font-black ">Products</h1>
          <Badge variant="outline">
            <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse mr-1"></span>
            {products?.length} products
          </Badge>
        </div>
        <div className="flex flex-col items-start mt-4">
          <div className="flex items-center mt-2">
            <span className="mx-2 text-xl font-bold">
              Manage submitted products here
            </span>
          </div>
          <p className="mt-2 text-left text-muted-foreground">
            Use the sync filters button to update <br /> new products tags,
            labels, and categories
          </p>
        </div>
      </div>

      <section className="grid flex-1 items-start gap-4   md:gap-8">
        <Tabs defaultValue="all">
          <div className="flex flex-col md:flex-row items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
            </TabsList>
            <div className="md:ml-auto my-6 md:my-0 flex items-center gap-2">
              <SyncFiltersButton />
              <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/submit">
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span className=" sm:whitespace-nowrap">Add App</span>
                </Link>
              </Button>
            </div>
          </div>
          <TabsContent value="all">
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader>
                <CardTitle>All Apps</CardTitle>
                <CardDescription>
                  Explore and manage your approved SaaS applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 && (
                  <AdminTable products={products} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="approved">
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader>
                <CardTitle>Approved Apps</CardTitle>
                <CardDescription>
                  Explore and manage your approved SaaS applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedProducts && approvedProducts.length > 0 && (
                  <AdminTable products={approvedProducts} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending">
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader>
                <CardTitle>Pending Apps</CardTitle>
                <CardDescription>
                  Explore and manage your pending SaaS applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingProducts && pendingProducts.length > 0 && (
                  <AdminTable products={pendingProducts} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="new">
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader>
                <CardTitle>New Apps</CardTitle>
                <CardDescription>
                  Explore and manage your new SaaS applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newProducts && newProducts.length > 0 && (
                  <AdminTable products={newProducts} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
