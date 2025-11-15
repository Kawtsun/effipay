import EmployeeFilter from '@/components/employee-filter'

export type PayrollFilterState = {
  types: string[]
  statuses: string[]
  roles: string[]
  collegeProgram?: string[]
  othersRole?: string
  basicEducationLevel?: string[]
}

export interface PayrollFilterButtonProps {
  value: PayrollFilterState
  onChange: (value: PayrollFilterState) => void
  othersRoles?: Array<{ value: string; label: string }>
  className?: string
}

export default function PayrollFilterButton({ value, onChange, othersRoles = [] }: PayrollFilterButtonProps) {
  return (
    <EmployeeFilter
      selectedTypes={value.types}
      selectedStatuses={value.statuses}
      selectedRoles={value.roles}
      collegeProgram={value.collegeProgram}
      othersRole={value.othersRole}
      basicEducationLevel={value.basicEducationLevel}
      othersRoles={othersRoles}
      onChange={onChange}
      hideTypes
      hideStatuses
      compact
    />
  )
}
