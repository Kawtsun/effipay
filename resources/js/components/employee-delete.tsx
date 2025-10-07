import { FC } from "react"
import { useForm } from "@inertiajs/react"
import { Employees } from "@/types"
import { formatFullName } from "@/utils/formatFullName"
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

  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete{" "}
            <strong>{employee ? toTitleCase(formatFullName(employee.last_name, employee.first_name, employee.middle_name)) : ''}</strong> (ID: {employee?.id})?
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
