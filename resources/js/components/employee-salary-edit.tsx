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

  function formatDisplay(raw: string) {
    if (!raw) return ""
    const num = parseInt(raw.replace(/\D/g, ""), 10)
    return isNaN(num) ? "" : num.toLocaleString("en-PH")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numeric = data[field] === "" ? 0 : parseInt(data[field], 10)

    // Validate PhilHealth range
    if (field === 'philhealth') {
      if (numeric < 250 || numeric > 2500) {
        toast.error('PhilHealth must be between ₱250 and ₱2,500')
        return
      }
    }

    // Validate Pag-IBIG minimum
    if (field === 'pag_ibig') {
      if (numeric < 200) {
        toast.error('Pag-IBIG must be at least ₱200')
        return
      }
    }

    // If updating base salary, also update PhilHealth automatically
    let updateData = { [field]: numeric }
    if (field === 'base_salary') {
      const calculatedPhilHealth = calculatePhilHealth(numeric)
      updateData = {
        [field]: numeric,
        philhealth: calculatedPhilHealth
      }
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                ₱
              </span>
              <Input
                id={field}
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                className="pl-8"
                min={field === 'philhealth' ? 250 : field === 'pag_ibig' ? 200 : undefined}
                max={field === 'philhealth' ? 2500 : undefined}
                value={formatDisplay(data[field])}
                onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                  if (!/[\d]/.test((e as InputEvent).data ?? "")) {
                    e.preventDefault()
                  }
                }}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement
                  const raw = input.value.replace(/\D/g, "")
                  input.value = formatDisplay(raw)
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
