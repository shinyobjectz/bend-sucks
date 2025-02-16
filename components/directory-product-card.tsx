"use client"

import { useOptimistic } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Tag } from "lucide-react"

import { cn } from "@/lib/utils"
import MinimalCard, {
  MinimalCardContent,
  MinimalCardDescription,
  MinimalCardFooter,
  MinimalCardImage,
  MinimalCardTitle,
} from "@/components/cult/minimal-card"
import { incrementClickCount } from "@/app/actions/product"

export const getBasePath = (url: string) => {
  return new URL(url).hostname.replace("www.", "").split(".")[0]
}

export const getLastPathSegment = (url: string, maxLength: number): string => {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments.pop() || ""

    if (lastSegment.length > maxLength) {
      return `/${lastSegment.substring(0, maxLength)}`
    }

    return lastSegment ? `/${lastSegment}` : ""
  } catch (error) {
    console.error("Invalid URL:", error)
    return ""
  }
}

interface Product {
  id: string
  created_at: string
  full_name: string
  email: string
  twitter_handle: string
  product_website: string
  codename: string
  punchline: string
  description: string
  logo_src: string
  user_id: string
  tags: string[]
  view_count: number
  approved: boolean
  labels: string[]
  categories: string
}

export const ProductLink: React.FC<{
  trim?: boolean
  data: Product
  order: any
  isFeatured?: boolean
}> = ({ data, order, isFeatured }) => {
  const [optimisticResource, addOptimisticUpdate] = useOptimistic<
    Product,
    Partial<Product>
  >(data, (currentResource, newProperties) => {
    return { ...currentResource, ...newProperties }
  })

  const handleClick = () => {
    const newClickCount = (optimisticResource.view_count || 0) + 1
    addOptimisticUpdate({ view_count: newClickCount })
    incrementClickCount(data.id)
  }

  const url = isFeatured ? `"https://newcult.co"` : `/products/${data.id}`
  console.log("url", url)

  return (
    <motion.div
      key={`resource-card-${data.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative  break-inside-avoid w-full"
    >
      <div className="w-full">
        <Link
          href={url || `/products/${data.id}`}
          key={`/products/${data.id}`}
          onClick={handleClick}
        >
          <ResourceCard
            data={data}
            view_count={optimisticResource.view_count}
          />
        </Link>
      </div>
    </motion.div>
  )
}

export const FeaturedExternalLink: React.FC<{
  trim?: boolean
  data: Product
  order: any
}> = ({ data, order }) => {
  return (
    <motion.div
      key={`resource-card-${data.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative  break-inside-avoid w-full"
    >
      <div className="w-full">
        <a
          href={data.product_website}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ResourceCard data={data} view_count={0} trim={true} />
        </a>
      </div>
    </motion.div>
  )
}

function ResourceCard({
  data,
  view_count,
  trim = false,
}: {
  data: Product
  view_count: number
  trim?: boolean
}) {
  return (
    <MinimalCard className="w-full">
      {data.logo_src ? (
        <MinimalCardImage alt={data.codename} src={data.logo_src} />
      ) : null}

      <MinimalCardTitle className="font-semibold mb-0.5">
        {data.codename.substring(0, 30)}
      </MinimalCardTitle>
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs leading-3 mb-2 text-neutral-500"
      >
        {getLastPathSegment(data.product_website, 10)}
      </motion.p>
      <MinimalCardDescription className="text-sm">
        {trim ? `${data.description.slice(0, 82)}...` : data.description}
      </MinimalCardDescription>

      <MinimalCardContent />
      <MinimalCardFooter>
        <div
          className={cn(
            "p-1 py-1.5 px-1.5 rounded-md text-neutral-500 flex items-center gap-1  absolute bottom-2 left-2 rounded-br-[16px]",
            view_count > 1 ? "  block" : "hidden"
          )}
        >
          <p className="flex items-center gap-1 tracking-tight text-neutral pr-1 text-xs">
            {view_count || data.view_count}
          </p>
        </div>
        <div className="p-1 py-1.5 px-1.5 rounded-md text-neutral-500 flex items-center gap-1  absolute bottom-2 right-2 rounded-br-[16px]">
          <Tag className="h-4 w-4 ml-[1px]" />
          <p className="flex items-center gap-1 tracking-tight text-neutral pr-1 text-xs">
            {data.labels[0]}
          </p>
        </div>
      </MinimalCardFooter>
    </MinimalCard>
  )
}
