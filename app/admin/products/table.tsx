"use client"

import React, { useEffect, useOptimistic, useState } from "react"
import { PencilIcon, ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

import {
  approveAllPendingProducts,
  deleteProduct,
  updateProduct,
} from "./actions"

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
  categories: string[] | null
  tags: string[] | null
  labels: string[] | null
  approved: boolean
  archived?: boolean
}

interface AdminTableProps {
  products: Product[]
}

type ProductState = {
  products: Product[]
  pendingProductIds: Set<string>
}

type UpdateProductState = {
  updatedProduct?: Product
  pendingProductId?: string
  pendingProductIdToRemove?: string
  deletedProductId?: string
  approvedProductIds?: string[]
}

export const AdminTable: React.FC<AdminTableProps> = ({ products }) => {
  const [state, setState] = useOptimistic<ProductState, UpdateProductState>(
    { products, pendingProductIds: new Set() },
    updateProductState
  )

  const [undoDelete, setUndoDelete] = useState<null | {
    id: string
    timeout: NodeJS.Timeout
  }>(null)

  const [deletingProductIds, setDeletingProductIds] = useState<Set<string>>(
    new Set()
  )

  const toggleApproval = async (id: string, approved: boolean) => {
    const product = state.products.find((p) => p.id === id)
    if (!product) return
    const updatedProduct = { ...product, approved }
    setState({ updatedProduct, pendingProductId: id })
    try {
      await updateProduct(id, approved)
    } finally {
      setState({
        pendingProductIdToRemove: id,
      })
    }
  }

  const handleDelete = (id: string) => {
    setState({ pendingProductId: id })
    handleDeleteProduct(id, setState, setUndoDelete, setDeletingProductIds)
  }

  const cancelDelete = (id: string) =>
    cancelDeleteProduct(id, undoDelete, setUndoDelete, setDeletingProductIds)

  const handleApproveAllPending = async () => {
    try {
      const approvedIds = await approveAllPendingProducts()
      setState({
        approvedProductIds: approvedIds,
      })
    } catch (error) {
      console.error("Error approving all pending products:", error)
    }
  }

  useEffect(() => {
    if (undoDelete) {
      const interval = setInterval(() => {
        setDeletingProductIds((prev) => {
          const newSet = new Set(prev)
          if (newSet.has(undoDelete.id)) {
            newSet.delete(undoDelete.id)
          } else {
            newSet.add(undoDelete.id)
          }
          return newSet
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [undoDelete])

  return (
    <div>
      <div className=" flex w-full">
        <Button onClick={handleApproveAllPending} className="mb-4 ml-auto">
          <ShieldCheckIcon className="size-5 mr-1" />
          Approve All Pending
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell md:w-[100px]">
                <span className="sr-only">Logo</span>
              </TableHead>
              <TableHead className="md:min-w-[50px]">Name</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[50px]">
                Twitter
              </TableHead>
              <TableHead className="hidden lg:table-cell md:min-w-[50px]">
                Website
              </TableHead>
              <TableHead className="hidden lg:table-cell min-w-[150px]">
                Punchline
              </TableHead>
              <TableHead className="hidden lg:table-cell md:min-w-[200px] max-w-sm">
                Description
              </TableHead>
              <TableHead className="min-w-[100px]">Approved</TableHead>
              <TableHead className="w-[100px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.products.map((product) => (
              <TableRow
                key={product.id}
                className={`${
                  deletingProductIds.has(product.id)
                    ? "opacity-50"
                    : "opacity-100"
                } transition-opacity duration-1000 ease-in-out`}
              >
                <TableCell className="hidden md:table-cell">
                  <img
                    alt={`${product.codename} logo`}
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={product.logo_src}
                    width="64"
                  />
                </TableCell>
                <TableCell className="overflow-hidden font-medium text-xs md:text-sm">
                  {product.full_name}
                </TableCell>
                <TableCell className="hidden sm:table-cell ">
                  {product.twitter_handle}
                </TableCell>
                <TableCell className="truncate sm:table-cell hidden ">
                  <a
                    href={product.product_website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {product.product_website.substring(0, 30)}
                  </a>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.punchline}
                </TableCell>
                <TableCell className="hidden lg:table-cell overflow-hidden max-w-sm">
                  {product.description}
                </TableCell>
                <TableCell>
                  {product.approved ? (
                    <Badge>Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        variant="ghost"
                        disabled={state.pendingProductIds.has(product.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          toggleApproval(product.id, !product.approved)
                        }
                        disabled={state.pendingProductIds.has(product.id)}
                      >
                        {product.approved ? "Revoke Approval" : "Approve"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(product.id)}
                        disabled={state.pendingProductIds.has(product.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                      {undoDelete && undoDelete.id === product.id && (
                        <DropdownMenuItem
                          onClick={() => cancelDelete(product.id)}
                          disabled={state.pendingProductIds.has(product.id)}
                        >
                          Cancel Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {undoDelete && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          <span>Product will be archived in 5 seconds</span>
          <Button onClick={() => cancelDelete(undoDelete.id)} className="ml-4">
            Undo
          </Button>
        </div>
      )}
    </div>
  )
}

export const updateProductState = (
  state: ProductState,
  newState: UpdateProductState
): ProductState => ({
  products: newState.updatedProduct
    ? state.products.map((product) =>
        product.id === newState.updatedProduct!.id
          ? newState.updatedProduct!
          : product
      )
    : newState.deletedProductId
    ? state.products.filter(
        (product) => product.id !== newState.deletedProductId
      )
    : newState.approvedProductIds
    ? state.products.map((product) =>
        newState.approvedProductIds!.includes(product.id)
          ? { ...product, approved: true }
          : product
      )
    : state.products,
  pendingProductIds: newState.pendingProductId
    ? new Set([...state.pendingProductIds, newState.pendingProductId])
    : new Set(
        [...state.pendingProductIds].filter(
          (id) => id !== newState.pendingProductIdToRemove
        )
      ),
})

export const handleDeleteProduct = (
  id: string,
  setState: React.Dispatch<UpdateProductState>,
  setUndoDelete: React.Dispatch<
    React.SetStateAction<null | { id: string; timeout: NodeJS.Timeout }>
  >,
  setDeletingProductIds: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const timeout = setTimeout(async () => {
    await deleteProduct(id)
    setState({
      deletedProductId: id,
    })
    setUndoDelete(null)
  }, 5000)

  setUndoDelete({ id, timeout })
  setDeletingProductIds((prev) => new Set(prev.add(id)))
}

export const cancelDeleteProduct = (
  id: string,
  undoDelete: { id: string; timeout: NodeJS.Timeout } | null,
  setUndoDelete: React.Dispatch<
    React.SetStateAction<null | { id: string; timeout: NodeJS.Timeout }>
  >,
  setDeletingProductIds: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  if (undoDelete && undoDelete.id === id) {
    clearTimeout(undoDelete.timeout)
    setUndoDelete(null)
    setDeletingProductIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }
}
