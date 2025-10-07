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
  search: string
  filters: { category?: string; types: string[]; statuses: string[]; roles: string[]; collegeProgram?: string }
  page: number
  perPage?: number
  onDeleted?: () => void
}

const EmployeeDelete: FC<Props> = ({
  open,
  setOpen,
  employee,
  search,
  filters,
  page,
  perPage,
  onDeleted,
}) => {
  const form = useForm()

  function confirmDelete() {
    if (!employee) return

    form.delete(
      route('employees.destroy', {
        employee: employee.id,
        search,
        category: filters.category,
        types: filters.types,
        statuses: filters.statuses,
        roles: Array.isArray(filters.roles) ? filters.roles : filters.roles ? [filters.roles] : [],
        collegeProgram: filters.collegeProgram,
        page,
        perPage,
        per_page: perPage,
      }),
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false)
          onDeleted?.()
          // Optional client reload of specific props if available
          // @ts-expect-error Inertia injected on window in some setups
          if (typeof window !== 'undefined' && window.Inertia?.router?.reload) {
            // @ts-expect-error see above
            window.Inertia.router.reload({ only: ['employeeClassifications'] })
          }
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
            <strong>{employee ? `${(employee.last_name || '').replace(/\b\w/g, c => c.toUpperCase())}, ${(employee.first_name || '').replace(/\b\w/g, c => c.toUpperCase())}, ${(employee.middle_name || '').replace(/\b\w/g, c => c.toUpperCase())}` : ''}</strong> (ID: {employee?.id})?
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
