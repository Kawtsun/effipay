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

  // reset to the latest server value any time the dialog closes
  React.useEffect(() => {
    if (!open) {
      reset(field as any)
      setData(field as any, value.toString())
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

    put(
      route("salary.update", { salary: employeeType }),
      {
        data: { [field]: numeric },
        preserveScroll: true,

        onSuccess: () => {
          toast.success(`${label} updated`)
          setOpen(false)
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
                  setData(field as any, raw)
                }}
              // no autoFocus here
              />
            </div>
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
