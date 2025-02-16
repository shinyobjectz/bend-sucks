import { createClient } from "@/db/supabase/server"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { UserAdminTable } from "./table"

export const dynamic = "force-dynamic"

export default async function UserDashboard() {
  const db = await createClient()
  const { data: users, error } = await db
    .from("users")
    .select("id, full_name, avatar_url")

  if (error) {
    console.error("Error fetching users:", error)
    return <div>Error loading users</div>
  }

  return (
    <main className="sm:px-12 sm:pl-20 sm:py-0 p-4 space-y-12">
      <div className="flex gap-8 items-center justify-start w-full">
        <div className="flex flex-col items-start justify-center gap-2 ">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl md:text-5xl font-black ">Users</h1>
            <Badge variant="outline">
              <span className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse mr-1"></span>
              {users?.length} users
            </Badge>
          </div>
          <div className="flex flex-col items-start mt-4">
            <div className="flex items-center mt-2">
              <span className="mx-2 text-xl font-bold">
                Users that have signed up or added products
              </span>
            </div>
            <p className="mt-2 text-left text-muted-foreground">
              Admins can manage users here. <br />
            </p>
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>User Dashboard</CardTitle>
          <CardDescription>
            Manage user information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <UserAdminTable users={users} />
          ) : (
            <div>No users found</div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
