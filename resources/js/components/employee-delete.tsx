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

interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  employee: Employees | null
  onDeleted?: () => void
}

export const EmployeeDelete: FC<Props> = ({
  open,
  setOpen,
  employee,
  onDeleted,
}) => {
  const form = useForm()

  function confirmDelete() {
    if (!employee) return

    form.delete(route("employees.destroy", employee.id), {
      // no preserveState so flash can show
      onSuccess: () => {
        setOpen(false)
        onDeleted?.()
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete <strong>{employee?.employee_name}</strong>?
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
