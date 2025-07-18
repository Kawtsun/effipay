// resources/js/components/CurrencyInput.tsx

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  label: string
  prefix?: string
  value: string
  onValueChange: (val: string) => void
  error?: string
}

const formatter = new Intl.NumberFormat('en-PH')

export default function EmployeeCurrencyInput({
  label,
  prefix = '₱',
  value,
  onValueChange,
  error,
}: Props) {
  const [display, setDisplay] = useState('')

  // Whenever the raw `value` prop changes, re-format for display
  useEffect(() => {
    if (value === '' || isNaN(Number(value))) {
      setDisplay('')
    } else {
      setDisplay(prefix + formatter.format(Number(value)))
    }
  }, [value, prefix])

  // Strip non‐digits on each keystroke
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    onValueChange(raw)
  }

  return (
    <div className="flex flex-col space-y-1">
      <Label>{label}</Label>
      <Input value={display} onChange={handleChange} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
