"use client"

import React, { useOptimistic } from "react"
import { MoveHorizontalIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { updateCategory, updateLabel, updateTag } from "./actions"

interface Item {
  id: string
  name: string
  icon?: string
  created_at: string
}

interface AdminTableProps {
  items: Item[]
  itemType: "category" | "label" | "tag"
}

type ItemState = {
  items: Item[]
  pendingItemIds: Set<string>
}

type UpdateItemState = {
  updatedItem?: Item
  pendingItemId?: string
  pendingItemIdToRemove?: string
  deletedItemId?: string
}

export const AdminTable: React.FC<AdminTableProps> = ({ items, itemType }) => {
  const [state, setState] = useOptimistic<ItemState, UpdateItemState>(
    { items, pendingItemIds: new Set() },
    updateItemState
  )

  const toggleItemUpdate = async (id: string, name: string, icon?: string) => {
    const item = state.items.find((u) => u.id === id)
    if (!item) return
    const updatedItem = { ...item, name, icon }
    setState({ updatedItem, pendingItemId: id })
    try {
      if (itemType === "category") {
        await updateCategory(id, name, icon)
      } else if (itemType === "label") {
        await updateLabel(id, name)
      } else {
        await updateTag(id, name)
      }
    } finally {
      setState({
        pendingItemIdToRemove: id,
      })
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Created At</TableHead>
            {itemType === "category" && (
              <TableHead className="hidden sm:table-cell">Icon</TableHead>
            )}
            <TableHead>
              <span>Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.items.map((item) => (
            <TableRow
              key={item.id}
              className={`${
                state.pendingItemIds.has(item.id) ? "opacity-50" : "opacity-100"
              } transition-opacity duration-1000 ease-in-out`}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="hidden sm:table-cell font-medium">
                {item.created_at}
              </TableCell>
              {itemType === "category" && (
                <TableCell className="hidden sm:table-cell">
                  {item.icon || "N/A"}
                </TableCell>
              )}
              <TableCell className="ml-auto flex w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-haspopup="true"
                      // size="icon"
                      variant="ghost"
                      disabled={state.pendingItemIds.has(item.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() =>
                        toggleItemUpdate(item.id, item.name, item.icon)
                      }
                      disabled={state.pendingItemIds.has(item.id)}
                    >
                      Update
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const updateItemState = (
  state: ItemState,
  newState: UpdateItemState
): ItemState => ({
  items: newState.updatedItem
    ? state.items.map((item) =>
        item.id === newState.updatedItem!.id ? newState.updatedItem! : item
      )
    : state.items,
  pendingItemIds: newState.pendingItemId
    ? new Set([...state.pendingItemIds, newState.pendingItemId])
    : new Set(
        [...state.pendingItemIds].filter(
          (id) => id !== newState.pendingItemIdToRemove
        )
      ),
})
