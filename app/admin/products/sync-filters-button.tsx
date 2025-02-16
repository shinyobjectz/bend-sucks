"use client"

import { useState } from "react"
import { Filter, InfoIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { updateFilters } from "./actions"

export function SyncFiltersButton() {
  const [status, setStatus] = useState("idle")
  const handleFilterSync = async () => {
    setStatus("loading")
    try {
      await updateFilters()
    } catch (error) {
      console.error("Error syncing filters:", error)
    } finally {
      toast.success("Filters synced successfully!")
      setStatus("idle")
    }
  }

  return (
    <Tooltip>
      <TooltipContent className="max-w-xs">
        <div className="flex items-center gap-2">
          <InfoIcon className="size-8" />
          <p className="text-pretty text-sm ">
            This will sync all new tags, labels, and categories to the database
            + navbar.
          </p>
        </div>
      </TooltipContent>
      <TooltipTrigger>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={handleFilterSync}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className=" sm:whitespace-nowrap">
            {status === "loading" ? "Syncing..." : "Sync Filters"}
          </span>
        </Button>
      </TooltipTrigger>
    </Tooltip>
  )
}
