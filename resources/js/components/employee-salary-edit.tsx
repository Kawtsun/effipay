"use client"

import * as React from "react"
import { useForm } from "@inertiajs/react"
import { toast } from "sonner"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"
import { router } from "@inertiajs/react"

interface Props {
  employeeType: string
  field: keyof Defaults
  label: string
  value: number
}

type Defaults = {
  employee_type: string
  base_salary: number
  overtime_pay: number
  sss: number
  philhealth: number
  pag_ibig: number
  withholding_tax: number
  work_hours_per_day: number
}

export function EmployeeSalaryEdit({ employeeType, field, label, value }: Props) {
  const [open, setOpen] = React.useState(false)

  const { data, setData, put, processing, reset, errors } = useForm({
    [field]: value.toString(),
  })

  // Calculate PhilHealth based on base salary
  const calculatePhilHealth = (baseSalary: number): number => {
    const calculated = (baseSalary * 0.05) / 4
    return Math.max(250, Math.min(2500, calculated))
  }

  // reset to the latest server value any time the dialog closes
  React.useEffect(() => {
    if (!open) {
      reset(field as keyof typeof data)
      setData(field as keyof typeof data, value.toString())
    }
  }, [open, value])

  function formatDisplay(raw: string, isHours: boolean = false) {
    if (!raw) return ""
    const num = parseInt(raw.replace(/\D/g, ""), 10)
    if (isNaN(num)) return ""
    return isHours ? num.toString() : num.toLocaleString("en-PH")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Always send latest values for base_salary, sss, and pag_ibig
    const baseSalary = data.base_salary ? parseInt(data.base_salary, 10) : 0;
    const sss = data.sss ? parseInt(data.sss, 10) : 0;
    const pagIbig = data.pag_ibig ? parseInt(data.pag_ibig, 10) : 0;
    const fieldValue = data[field] === "" ? 0 : parseInt(data[field], 10);

    // Validate PhilHealth range
    if (field === 'philhealth') {
      if (fieldValue < 250 || fieldValue > 2500) {
        toast.error('PhilHealth must be between ₱250 and ₱2,500')
        return
      }
    }

    // Validate Pag-IBIG minimum
    if (field === 'pag_ibig') {
      if (fieldValue < 200) {
        toast.error('Pag-IBIG must be at least ₱200')
        return
      }
    }

    // Validate work hours
    if (field === 'work_hours_per_day') {
      if (fieldValue < 1 || fieldValue > 24) {
        toast.error('Work hours must be between 1 and 24 hours')
        return
      }
    }

    // Always send all three fields for backend automation
    let updateData: any = { [field]: fieldValue };
    if (['base_salary', 'sss', 'pag_ibig'].includes(field)) {
      updateData = {
        base_salary: field === 'base_salary' ? fieldValue : baseSalary,
        sss: field === 'sss' ? fieldValue : sss,
        pag_ibig: field === 'pag_ibig' ? fieldValue : pagIbig,
      };
    }

    put(
      route("salary.update", { salary: employeeType }),
      {
        ...updateData,
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`${label} updated`)
          setOpen(false)
          // Refresh the page to show updated values
          router.reload({ only: ['defaults'] })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={field}>{label}</Label>
            <div className="relative">
              {field !== 'work_hours_per_day' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  ₱
                </span>
              )}
              <Input
                id={field}
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                className={field === 'work_hours_per_day' ? "" : "pl-8"}
                min={field === 'philhealth' ? 250 : field === 'pag_ibig' ? 200 : field === 'work_hours_per_day' ? 1 : undefined}
                max={field === 'philhealth' ? 2500 : field === 'work_hours_per_day' ? 24 : undefined}
                value={formatDisplay(data[field], field === 'work_hours_per_day')}
                onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                  if (!/[\d]/.test((e as InputEvent).data ?? "")) {
                    e.preventDefault()
                  }
                }}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement
                  const raw = input.value.replace(/\D/g, "")
                  input.value = formatDisplay(raw, field === 'work_hours_per_day')
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "")
                  setData(field as keyof typeof data, raw)
                }}
              // no autoFocus here
              />
            </div>
            {field === 'philhealth' && (
              <p className="text-xs text-muted-foreground">
                Must be between ₱250 and ₱2,500
              </p>
            )}
            {field === 'pag_ibig' && (
              <p className="text-xs text-muted-foreground">
                Must be at least ₱200
              </p>
            )}
            {field === 'work_hours_per_day' && (
              <p className="text-xs text-muted-foreground">
                Must be between 1 and 24 hours
              </p>
            )}
            {errors[field as keyof typeof errors] && (
              <p className="text-sm text-red-600">
                {errors[field as keyof typeof errors]}
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"                // ← prevent this from submitting the form
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
