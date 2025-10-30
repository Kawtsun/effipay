"use client"

import React, { useState, useEffect, useRef } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X } from "lucide-react"
import { employee_status, leave_statuses } from "./employee-status"
import { Badge } from "./ui/badge"
import EmployeeCollegeCheckboxDepartment from './employee-college-checkbox-department';
import CollegeProgramScrollArea from './college-program-scroll-area';
import OthersRolesRadio from './others-roles-radio';
import OthersRolesScrollArea from './others-roles-scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import FilterScrollArea from './filter-scroll-area';
import EmployeeBasicEducationLevel from '@/components/employee-basic-education-level'
import BasicEducationScrollArea from '@/components/basic-education-scroll-area'

interface FilterState {
  types: string[]
  statuses: string[]
  roles: string[]
  collegeProgram?: string[]
  othersRole?: string // NEW
  basicEducationLevel?: string[] // NEW
}

interface Props {
  selectedTypes: string[]
  selectedStatuses: string[]
  selectedRoles: string[]
  collegeProgram?: string[]
  othersRole?: string // NEW
  othersRoles?: Array<{ value: string; label: string }> // Available others roles
  basicEducationLevel?: string[] // NEW
  onChange: (filters: FilterState) => void
  hideTypes?: boolean
  hideStatuses?: boolean
  compact?: boolean
}

const employee_type = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Provisionary", label: "Provisionary" },
  { value: "Regular", label: "Regular" },
];


export default function EmployeeFilter({
  selectedTypes,
  selectedStatuses,
  selectedRoles,
  collegeProgram: selectedCollegeProgram = [],
  othersRole: selectedOthersRole = '', // NEW
  othersRoles = [], // NEW
  basicEducationLevel: selectedBasicEducationLevel = [], // NEW
  onChange,
  hideTypes = false,
  hideStatuses = false,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false)

  // local draft state
  const [types, setTypes] = useState<string[]>(selectedTypes)
  const [statuses, setStatuses] = useState<string[]>(selectedStatuses)
  const [roles, setRoles] = useState<string[]>(selectedRoles)
  const [collegeProgram, setCollegeProgram] = useState<string[]>(selectedCollegeProgram)
  const [othersRole, setOthersRole] = useState<string>(selectedOthersRole) // NEW
  const [basicEducationLevel, setBasicEducationLevel] = useState<string[]>(selectedBasicEducationLevel) // NEW

  const collegeDeptRef = useRef<HTMLDivElement>(null);
  const othersRolesRef = useRef<HTMLDivElement>(null);

  // helpers
  const arraysEqual = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every(x => b.includes(x))
  const draftChanged =
    !arraysEqual(types, selectedTypes) ||
    !arraysEqual(statuses, selectedStatuses) ||
    !arraysEqual(roles, selectedRoles) ||
    !arraysEqual(collegeProgram, selectedCollegeProgram) ||
    (othersRole || '') !== (selectedOthersRole || '') ||
    !arraysEqual(basicEducationLevel, selectedBasicEducationLevel)

  // sync draft when parent resets
  useEffect(() => {
    setTypes(selectedTypes)
  }, [selectedTypes])

  useEffect(() => {
    setStatuses(selectedStatuses)
  }, [selectedStatuses])

  useEffect(() => {
    setRoles(selectedRoles)
  }, [selectedRoles])

  useEffect(() => {
    setCollegeProgram(selectedCollegeProgram)
  }, [selectedCollegeProgram])

  useEffect(() => {
    setOthersRole(selectedOthersRole)
  }, [selectedOthersRole])

  useEffect(() => {
    setBasicEducationLevel(selectedBasicEducationLevel)
  }, [selectedBasicEducationLevel])

  // toggle single value in array
  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  // apply and close
  const handleApply = () => {
    onChange({ types, statuses, roles, collegeProgram, othersRole, basicEducationLevel })
    setOpen(false)
  }

  // reset and close
  const handleReset = () => {
    setTypes([])
    setStatuses([])
    setRoles([])
    setCollegeProgram([])
    setOthersRole('')
    setBasicEducationLevel([])
    onChange({ types: [], statuses: [], roles: [], collegeProgram: [], othersRole: '', basicEducationLevel: [] })
    setOpen(false)
  }
  const activeCount =
    (hideTypes ? 0 : selectedTypes.length) +
    (hideStatuses ? 0 : selectedStatuses.length) +
    selectedRoles.length +
    (selectedCollegeProgram?.length || 0) +
    (selectedBasicEducationLevel?.length || 0) +
    (selectedOthersRole ? 1 : 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>


      <PopoverContent className={`${compact ? 'w-64 h-[360px]' : 'w-76 h-[500px]'} p-0 flex flex-col`}>
        <FilterScrollArea className="flex-1 p-4 space-y-5">
          {/* Active selections summary chips */}
          {(types.length > 0 || statuses.length > 0 || roles.length > 0 || collegeProgram.length > 0 || basicEducationLevel.length > 0 || !!othersRole) && (
            <div className="mb-1">
              <div className="text-xs text-muted-foreground mb-1 select-none">Selected</div>
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <span key={`t-${t}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {t}
                    <button aria-label={`Remove ${t}`} className="opacity-70 hover:opacity-100" onClick={() => setTypes(types.filter(x => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {statuses.map((s) => (
                  <span key={`s-${s}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {s}
                    <button aria-label={`Remove ${s}`} className="opacity-70 hover:opacity-100" onClick={() => setStatuses(statuses.filter(x => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {roles.map((r) => (
                  <span key={`r-${r}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r}
                    <button aria-label={`Remove ${r}`} className="opacity-70 hover:opacity-100" onClick={() => setRoles(roles.filter(x => x !== r))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {collegeProgram.map((cp) => (
                  <span key={`cp-${cp}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {cp}
                    <button aria-label={`Remove ${cp}`} className="opacity-70 hover:opacity-100" onClick={() => setCollegeProgram(collegeProgram.filter(x => x !== cp))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {basicEducationLevel.map((be) => (
                  <span key={`be-${be}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {be}
                    <button aria-label={`Remove ${be}`} className="opacity-70 hover:opacity-100" onClick={() => setBasicEducationLevel([])}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {othersRole && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {`Others: ${othersRole}`}
                    <button aria-label={`Clear others role`} className="opacity-70 hover:opacity-100" onClick={() => setOthersRole('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
          {!hideTypes && (
          <div className="my-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold select-none">Employee Type{types.length ? ` (${types.length})` : ''}</h4>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 select-none">
                <button className="hover:underline" onClick={() => setTypes(employee_type.map(e => e.value))}>Select all</button>
                <span>·</span>
                <button className="hover:underline" onClick={() => setTypes([])}>Clear</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2 select-none">
              Select one or more types to filter by employment classification.
            </p>
            {employee_type.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
                <Checkbox
                  checked={types.includes(value)}
                  onCheckedChange={() => setTypes(toggle(types, value))}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                {label}
              </label>
            ))}
          </div>
          )}

          {!hideStatuses && (
          <div className="my-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold select-none">Employee Status{statuses.length ? ` (${statuses.length})` : ''}</h4>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 select-none">
                <button className="hover:underline" onClick={() => setStatuses([...employee_status.map(e => e.value), ...leave_statuses.map(e => e.value)])}>Select all</button>
                <span>·</span>
                <button className="hover:underline" onClick={() => setStatuses([])}>Clear</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2 select-none">
              Filter employees by their current work status.
            </p>
            {employee_status.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
                <Checkbox
                  checked={statuses.includes(value)}
                  onCheckedChange={() => setStatuses(toggle(statuses, value))}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                {label}
              </label>
            ))}
            <div className="mt-2 mb-1 text-xs font-semibold text-muted-foreground select-none">Leave</div>
            {leave_statuses.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
                <Checkbox
                  checked={statuses.includes(value)}
                  onCheckedChange={() => setStatuses(toggle(statuses, value))}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                {label}
              </label>
            ))}
          </div>
          )}

          <div className="my-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold select-none">Roles{roles.length ? ` (${roles.length})` : ''}</h4>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 select-none">
                <button className="hover:underline" onClick={() => setRoles([])}>Clear</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2 select-none">
              Filter by employee roles.
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm select-none">
                <Checkbox
                  checked={roles.includes('administrator')}
                  onCheckedChange={() => {
                    const newRoles = roles.filter(r => r !== 'administrator');
                    if (roles.includes('administrator')) {
                      setRoles(newRoles);
                    } else {
                      setRoles([...newRoles, 'administrator']);
                    }
                  }}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                Administrator
              </label>
              <label className="flex items-center gap-2 text-sm select-none">
                <Checkbox
                  checked={roles.includes('college instructor')}
                  onCheckedChange={() => {
                    const newRoles = roles.filter(r => r !== 'college instructor');
                    if (roles.includes('college instructor')) {
                      setRoles(newRoles);
                    } else {
                      setRoles([...newRoles, 'college instructor']);
                    }
                    if (!roles.includes('college instructor')) {
                      setTimeout(() => {
                        collegeDeptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                College Instructor
              </label>
              <label className="flex items-center gap-2 text-sm select-none">
                <Checkbox
                  checked={roles.includes('basic education instructor')}
                  onCheckedChange={() => {
                    const newRoles = roles.filter(r => r !== 'basic education instructor');
                    if (roles.includes('basic education instructor')) {
                      setRoles(newRoles);
                    } else {
                      setRoles([...newRoles, 'basic education instructor']);
                    }
                  }}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                Basic Education Instructor
              </label>
              {/* Basic Education Level radio group, only show if basic education instructor is selected */}
              <AnimatePresence>
                {roles.includes('basic education instructor') && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pl-4 mt-2"
                  >
                    <div className="text-xs font-semibold mb-1">Basic Education Level</div>
                    <BasicEducationScrollArea>
                      <EmployeeBasicEducationLevel
                        value={basicEducationLevel[0] || ''}
                        onChange={(val) => setBasicEducationLevel(val ? [val] : [])}
                      />
                    </BasicEducationScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
              <label className="flex items-center gap-2 text-sm select-none">
                <Checkbox
                  checked={roles.includes('others')}
                  onCheckedChange={() => {
                    const newRoles = roles.filter(r => r !== 'others');
                    if (roles.includes('others')) {
                      setRoles(newRoles);
                      setOthersRole('');
                    } else {
                      setRoles([...newRoles, 'others']);
                    }
                    if (!roles.includes('others')) {
                      setTimeout(() => {
                        othersRolesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                />
                Others
              </label>
              
              {/* College program radio group, only show if college instructor is selected */}
              <AnimatePresence>
                {roles.includes('college instructor') && (
                  <motion.div
                    ref={collegeDeptRef}
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pl-4 mt-2"
                  >
                    <div className="text-xs font-semibold mb-1">College Department</div>
                    <CollegeProgramScrollArea>
                      <EmployeeCollegeCheckboxDepartment
                        value={collegeProgram}
                        onChange={setCollegeProgram}
                      />
                    </CollegeProgramScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Others roles radio group, only show if others is selected */}
              <AnimatePresence>
                {roles.includes('others') && (
                  <motion.div
                    ref={othersRolesRef}
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pl-4 mt-2"
                  >
                    <div className="text-xs font-semibold mb-1">Other Roles</div>
                    <OthersRolesScrollArea>
                      <OthersRolesRadio
                        value={othersRole}
                        onChange={(val) => {
                          setOthersRole(val);
                          // Don't add the specific role to roles array - just set othersRole
                          // The "others" role in roles array handles the base filtering
                        }}
                        roles={othersRoles}
                      />
                    </OthersRolesScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FilterScrollArea>
        <div className="flex justify-end gap-2 pt-3 border-t mt-2 bg-background sticky bottom-0 z-10 p-4">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!draftChanged}>
            Apply
          </Button>
        </div>
      </PopoverContent>

    </Popover>
  )
}
