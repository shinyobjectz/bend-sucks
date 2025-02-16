"use client"

import React from "react"
import { AppleIcon, Box, Hash, TagIcon, UserIcon } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MetricData {
  month: string
  total: number
}

interface OverviewChartProps {
  data: MetricData[]
  title: string
}

const OverviewChart: React.FC<OverviewChartProps> = ({ data, title }) => (
  <ResponsiveContainer width="100%" height={350}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="month"
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => `${value}`}
      />
      <Tooltip />
      <Line type="monotone" dataKey="total" stroke="#8884d8" />
    </LineChart>
  </ResponsiveContainer>
)

interface AnalyticsOverviewProps {
  users: MetricData[]
  products: MetricData[]
  categories: MetricData[]
  labels: MetricData[]
  tags: MetricData[]
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  users,
  products,
  categories,
  labels,
  tags,
}) => {
  return (
    <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <UserIcon className="size-7 bg-neutral-900 fill-yellow-300/30 stroke-yellow-500 p-1 rounded-full" />{" "}
            User Metrics
          </CardTitle>

          <CardDescription>Metrics about user activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart data={users} title="User Metrics" />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <AppleIcon className="size-7 bg-neutral-900 fill-yellow-300/30 stroke-yellow-500 p-1 rounded-full" />{" "}
            Product Metrics
          </CardTitle>

          <CardDescription>Metrics about product activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart data={products} title="Product Metrics" />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <Hash className="size-7 bg-neutral-900 fill-yellow-300/30 stroke-yellow-500 p-1 rounded-full" />{" "}
            Label Metrics
          </CardTitle>

          <CardDescription>Metrics about label activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart data={labels} title="Label Metrics" />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <Box className="size-7 bg-neutral-900 fill-yellow-300.30 stroke-yellow-500 p-1 rounded-full" />{" "}
            Category Metrics
          </CardTitle>

          <CardDescription>Metrics about category activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart data={categories} title="Category Metrics" />
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <TagIcon className="size-7 bg-neutral-900 fill-yellow-300/30 stroke-yellow-500 p-1 rounded-full" />{" "}
            Tag Metrics
          </CardTitle>

          <CardDescription>Metrics about tag activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart data={tags} title="Tag Metrics" />
        </CardContent>
      </Card>
    </div>
  )
}
