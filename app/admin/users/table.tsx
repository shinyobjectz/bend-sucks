"use client"

import React, { useOptimistic, useState } from "react"
import { MoveHorizontalIcon, PencilIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  updateBillingAddress,
  updatePaymentMethod,
  updateUser,
} from "./actions"

interface User {
  id: string
  full_name: string
  avatar_url: string
  billing_address?: object
  payment_method?: object
}

interface UserAdminTableProps {
  users: User[]
}

type UserState = {
  users: User[]
  pendingUserIds: Set<string>
}

type UpdateUserState = {
  updatedUser?: User
  pendingUserId?: string
  pendingUserIdToRemove?: string
  deletedUserId?: string
}

export const UserAdminTable: React.FC<UserAdminTableProps> = ({ users }) => {
  const [state, setState] = useOptimistic<UserState, UpdateUserState>(
    { users, pendingUserIds: new Set() },
    updateUserState
  )

  const [editUser, setEditUser] = useState<User | null>(null)
  const [newName, setNewName] = useState<string>("")
  const [newBillingAddress, setNewBillingAddress] = useState<object>({})
  const [newPaymentMethod, setNewPaymentMethod] = useState<object>({})

  const handleEditUser = (user: User) => {
    setEditUser(user)
    setNewName(user.full_name)
    setNewBillingAddress(user.billing_address || {})
    setNewPaymentMethod(user.payment_method || {})
  }

  const handleSaveChanges = async () => {
    if (editUser) {
      setState({
        updatedUser: {
          ...editUser,
          full_name: newName,
          billing_address: newBillingAddress,
          payment_method: newPaymentMethod,
        },
        pendingUserId: editUser.id,
      })
      try {
        await updateUser(editUser.id, newName)
        await updateBillingAddress(editUser.id, newBillingAddress)
        await updatePaymentMethod(editUser.id, newPaymentMethod)
      } finally {
        setState({ pendingUserIdToRemove: editUser.id })
        setEditUser(null)
      }
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Billing Address</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.users.map((user) => (
            <TableRow
              key={user.id}
              className={`${
                state.pendingUserIds.has(user.id) ? "opacity-50" : "opacity-100"
              } transition-opacity duration-1000 ease-in-out`}
            >
              <TableCell>
                <Avatar>
                  <AvatarImage
                    src={user.avatar_url}
                    alt={`${user.full_name}'s avatar`}
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>
                {JSON.stringify(user.billing_address) || "N/A"}
              </TableCell>
              <TableCell>
                {JSON.stringify(user.payment_method) || "N/A"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-haspopup="true"
                      variant="ghost"
                      disabled={state.pendingUserIds.has(user.id)}
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleEditUser(user)}
                      disabled={state.pendingUserIds.has(user.id)}
                    >
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editUser && (
        <Dialog open={Boolean(editUser)} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Make changes to the user profile here. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billing_address" className="text-right">
                  Billing Address
                </Label>
                <Input
                  id="billing_address"
                  value={JSON.stringify(newBillingAddress)}
                  onChange={(e) =>
                    setNewBillingAddress(JSON.parse(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_method" className="text-right">
                  Payment Method
                </Label>
                <Input
                  id="payment_method"
                  value={JSON.stringify(newPaymentMethod)}
                  onChange={(e) =>
                    setNewPaymentMethod(JSON.parse(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveChanges}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

const updateUserState = (
  state: UserState,
  newState: UpdateUserState
): UserState => ({
  users: newState.updatedUser
    ? state.users.map((user) =>
        user.id === newState.updatedUser!.id ? newState.updatedUser! : user
      )
    : state.users,
  pendingUserIds: newState.pendingUserId
    ? new Set([...state.pendingUserIds, newState.pendingUserId])
    : new Set(
        [...state.pendingUserIds].filter(
          (id) => id !== newState.pendingUserIdToRemove
        )
      ),
})
