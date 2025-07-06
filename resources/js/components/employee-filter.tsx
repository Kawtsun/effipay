import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter } from 'lucide-react'

interface Props {
  selectedTypes: string[]
  selectedStatuses: string[]
  onChange: (filters: { types: string[]; statuses: string[] }) => void
}

const EMPLOYEE_TYPES = ['Full Time', 'Part Time', 'Provisionary']
const EMPLOYEE_STATUSES = ['Active', 'Paid Leave', 'Maternity Leave']

export default function EmployeeFilter({
  selectedTypes,
  selectedStatuses,
  onChange,
}: Props) {
  const [types, setTypes] = useState<string[]>(selectedTypes)
  const [statuses, setStatuses] = useState<string[]>(selectedStatuses)

  const toggle = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value]

  const handleApply = () => {
    onChange({ types, statuses })
  }

  const handleReset = () => {
    setTypes([])
    setStatuses([])
    onChange({ types: [], statuses: [] })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Employee Type</h4>
            {EMPLOYEE_TYPES.map(type => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <Checkbox
                  id={`type-${type}`}
                  checked={types.includes(type)}
                  onCheckedChange={() => setTypes(toggle(types, type))}
                />
                <label htmlFor={`type-${type}`} className="text-sm">
                  {type}
                </label>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Employee Status</h4>
            {EMPLOYEE_STATUSES.map(status => (
              <div key={status} className="flex items-center gap-2 mb-1">
                <Checkbox
                  id={`status-${status}`}
                  checked={statuses.includes(status)}
                  onCheckedChange={() => setStatuses(toggle(statuses, status))}
                />
                <label htmlFor={`status-${status}`} className="text-sm">
                  {status}
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
