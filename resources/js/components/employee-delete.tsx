import { FC } from "react"
import { useForm } from "@inertiajs/react"
import { Employees } from "@/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { toast } from 'sonner'

interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  employee: Employees | null
  search: string
  filters: { types: string[]; statuses: string[] }
  page: number
  onDeleted?: () => void
}

const EmployeeDelete: FC<Props> = ({
  open,
  setOpen,
  employee,
  search,
  filters,
  page,
  onDeleted,
}) => {
  const form = useForm()

  function confirmDelete() {
    if (!employee) return


    form.delete(
      route('employees.destroy', {
        employee: employee.id,
        search,
        types: filters.types,
        statuses: filters.statuses,
        page,
      }),
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false)
          toast.success('Employee deleted successfully!')
          onDeleted?.()     // still notify parent to reload if you want
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete{" "}
            <strong>{employee?.employee_name}</strong> (ID: {employee?.id})?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={confirmDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EmployeeDelete
