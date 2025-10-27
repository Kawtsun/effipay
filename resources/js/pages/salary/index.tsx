import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Wallet, Calculator, TrendingUp } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

// shadcn Card imports
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ThirteenthMonthPayDialog from '@/components/thirtheen-month-pay-dialog'
import { PayrollMonthPicker } from '@/components/ui/payroll-month-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RolesTableBadge } from '@/components/roles-table-badge'
import { ScrollableCardGrid } from '../../components/scrollable-card-grid'
import PayrollFilterButton from '../../components/payroll-filter-button'
import { cn } from '@/lib/utils'
import PayrollSearch from '../../components/payroll-search'

type FlashObject = { type: string; message: string };
type PageProps = {
  flash?: string | FlashObject;
  errors: Record<string, string>;
  types: string[];
  selected: string;
}

export default function Index() {
  const { flash, errors } = usePage<PageProps>().props
  const [selectedMonth, setSelectedMonth] = useState('')
  type EmpLite = { id: number; name?: string; full_name?: string; first_name?: string; middle_name?: string; last_name?: string; employee_status?: string; roles?: string | string[]; college_program?: string }
  const [tkLists, setTkLists] = useState<{ with: Array<EmpLite>, without: Array<EmpLite> } | null>(null)
  const [loadingTkLists, setLoadingTkLists] = useState(false)
  const [isRunningPayroll, setIsRunningPayroll] = useState(false)
  const [isThirteenthMonthDialogOpen, setIsThirteenthMonthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'with-tk' | 'without-tk'>('with-tk')
  // Only categorize (split into With/Without TK) after payroll is run for the selected month
  const [hasCategorized, setHasCategorized] = useState(false)
  // Track how categorization was triggered: 'snapshot' | 'payroll' | 'import' | null
  const [categorizeSource, setCategorizeSource] = useState<null | 'snapshot' | 'payroll' | 'import'>(null)
  // Filters (share the same shape as EmployeeFilter)
  type FilterState = { types: string[]; statuses: string[]; roles: string[]; collegeProgram?: string[]; othersRole?: string }
  const [filters, setFilters] = useState<FilterState>({ types: [], statuses: [], roles: [], collegeProgram: [], othersRole: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const hasRoleFilters = filters.roles.length > 0
  const hasAnyFilters = hasRoleFilters || (searchTerm.trim().length > 0)

  // Persist categorization per month within the current session so it remains after navigation.
  const hasRunFlagKey = (m: string) => `salary.hasRun.${m}`
  const getHasRunFlag = (m: string) => {
    try { return sessionStorage.getItem(hasRunFlagKey(m)) === '1' } catch { return false }
  }
  const setHasRunFlag = (m: string, v: boolean) => {
    try { if (m) sessionStorage.setItem(hasRunFlagKey(m), v ? '1' : '0') } catch {}
  }

  // Removed snapshot caching to avoid stale UI; we now always fetch live lists when allowed.

  // Import flag helpers: remember that a timekeeping import occurred so we can auto-categorize
  const importFlagKey = (m: string) => `salary.imported.${m}`
  const getImportFlag = (m: string) => { try { return sessionStorage.getItem(importFlagKey(m)) === '1' } catch { return false } }
  const setImportFlag = (m: string, v: boolean) => { try { if (m) sessionStorage.setItem(importFlagKey(m), v ? '1' : '0') } catch {} }


  // Normalize input like YYYY-MM or YYYY-MM-DD to YYYY-MM
  const normalizeMonth = (val: string): string => {
    if (!val) return ''
    const m = (val || '').match(/^(\d{4}-\d{2})/)
    return m ? m[1] : ''
  }

  // Restore last selected month (so lists persist after running payroll/navigation)
  useEffect(() => {
    try {
      const key = 'salary.selectedMonth'
      const stored = localStorage.getItem(key) || ''
      const norm = normalizeMonth(stored)
      if (norm) {
        setSelectedMonth(norm)
      }
    } catch {}
  }, [])
  useEffect(() => {
    if (!flash) return;
    if (typeof flash === 'string') {
      if (flash === 'Payroll already run twice for this month.') {
        toast.info(flash);
      } else {
        toast.success(flash);
      }
    } else if (typeof flash === 'object' && flash !== null) {
      if (flash.type === 'error') {
        if (flash.message && flash.message.toLowerCase().includes('no time keeping data')) {
          toast.error('Some employees have no time keeping data. Please check time keeping records before running payroll.');
        } else {
          toast.error(flash.message || 'An error occurred');
        }
      } else if (flash.type === 'success') {
        toast.success(flash.message || 'Success');
      } else if (flash.message === 'Payroll already run twice for this month.') {
        toast.info(flash.message);
      } else {
        toast(flash.message || 'Notification');
      }
    }
  }, [flash])

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
    }
  }, [errors]);

  

  const handleRunPayroll = useCallback(async () => {
    if (!selectedMonth) {
      toast.error('Please select a date first')
      return
    }
    setIsRunningPayroll(true)
    setHasCategorized(false)
    setTkLists(null)
    router.post(
      route('payroll.run'),
      { payroll_date: selectedMonth },
      {
        // Keep current component alive so we can fetch categorized data immediately
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          // After running payroll, refresh the timekeeping lists and focus the tab
          setActiveTab('with-tk')
          setHasCategorized(true)
          setCategorizeSource('payroll')
          setHasRunFlag(selectedMonth, true)
          // Fetch categorized lists now
          ;(async () => {
            const lists = await loadTkLists(selectedMonth)
          })()
        },
        onFinish: () => setIsRunningPayroll(false),
      }
    )
  }, [selectedMonth])

  // Helper to fetch employees with/without timekeeping
  const loadTkLists = async (month: string): Promise<{ with: EmpLite[]; without: EmpLite[] } | null> => {
    const norm = normalizeMonth(month)
    if (!norm || !/^\d{4}-\d{2}$/.test(norm)) { setTkLists(null); return null }
    setLoadingTkLists(true)
    try {
      const res = await fetch(`/api/timekeeping/employees-by-month?month=${encodeURIComponent(norm)}`)
      if (res.ok) {
        const data = await res.json()
        const lists = { with: (data.with || []) as EmpLite[], without: (data.without || []) as EmpLite[] }
        setTkLists(lists)
        return lists
      } else {
        setTkLists({ with: [], without: [] })
        return { with: [], without: [] }
      }
    } catch {
      setTkLists({ with: [], without: [] })
      return { with: [], without: [] }
    } finally {
      setLoadingTkLists(false)
    }
  }

  // Removed background-only validation fetch; gating now relies on server 'processed months'.

  // Check if selected month exists in processed payroll months on server
  const isMonthProcessed = async (month: string): Promise<boolean> => {
    try {
      const res = await fetch('/payroll/processed-months')
      if (!res.ok) return false
      const data = await res.json()
      const list: string[] = Array.isArray(data?.months) ? data.months : []
      const norm = normalizeMonth(month)
      return list.includes(norm)
    } catch {
      return false
    }
  }
  // Build Others Roles options from current lists
  const othersRolesOptions = useMemo(() => {
    const standard = ['administrator', 'college instructor', 'basic education instructor']
    const all: string[] = []
    const pushRoles = (val?: string | string[]) => {
      if (!val) return
      const arr = Array.isArray(val) ? val : String(val).split(',')
      for (const r of arr) {
        const t = r.trim().toLowerCase()
        if (t && !all.includes(t)) all.push(t)
      }
    }
    if (tkLists) {
      tkLists.with.forEach(e => pushRoles(e.roles as unknown as string))
      tkLists.without.forEach(e => pushRoles(e.roles as unknown as string))
    }
    const custom = all.filter(r => !standard.includes(r))
    return custom.map(r => ({ value: r, label: r.replace(/\b\w/g, c => c.toUpperCase()) }))
  }, [tkLists])

  // Apply filters locally to a list of employees
  const applyFilters = useCallback((list: EmpLite[]) => {
    if (!hasAnyFilters) return list
    const standard = ['administrator', 'college instructor', 'basic education instructor']
    const selTypes = new Set(filters.types)
    // Status filter disabled; ignore
    const selRoles = new Set(filters.roles.map(r => r.toLowerCase()))
    const selCollege = new Set((filters.collegeProgram || []).map(cp => cp.toString()))
    const othersRole = (filters.othersRole || '').toLowerCase()

    return list.filter(emp => {
      // Search term on name fields (case-insensitive)
      const q = searchTerm.trim().toLowerCase()
      if (q) {
        const name = `${emp.full_name || ''} ${emp.name || ''} ${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      // Status filter removed per requirement
      // Roles filter
      if (selRoles.size > 0) {
        const rolesArr = Array.isArray(emp.roles)
          ? (emp.roles as string[])
          : String(emp.roles || '')
              .split(',')
              .map(r => r.trim().toLowerCase())

        let roleMatch = false
        for (const r of selRoles) {
          if (r === 'others') {
            // If specific othersRole chosen, must include it
            if (othersRole) {
              if (rolesArr.includes(othersRole)) roleMatch = true
            } else {
              // Otherwise, any role not in standard roles
              if (rolesArr.some(rr => !standard.includes(rr))) roleMatch = true
            }
          } else if (rolesArr.includes(r)) {
            roleMatch = true
          }
        }
        if (!roleMatch) return false

        // College program filter when college instructor selected
        if (selRoles.has('college instructor') && selCollege.size > 0) {
          const cp = String(emp.college_program || '')
          if (!selCollege.has(cp)) return false
        }
      }

      // Employee Type filter (no-op for now unless data present)
      if (selTypes.size > 0) {
        // EmpLite currently doesn't include employee_types; skip matching.
      }
      return true
    })
  }, [filters, hasAnyFilters, searchTerm])

  // Derived filtered lists for display and counts
  const filteredWith = useMemo(() => (tkLists ? applyFilters(tkLists.with) : []), [tkLists, applyFilters])
  const filteredWithout = useMemo(() => (tkLists ? applyFilters(tkLists.without) : []), [tkLists, applyFilters])
  // Parse roles into an array for the RolesTableBadge
  const rolesToArray = (roles?: string | string[]): string[] => {
    if (!roles) return []
    if (Array.isArray(roles)) return roles
    return roles.split(',').map(r => r.trim()).filter(Boolean)
  }

  // On month change: if the month is processed (server) or an import occurred for this month, fetch live lists; otherwise keep gated.
  useEffect(() => {
    if (!selectedMonth) { setTkLists(null); setHasCategorized(false); return }
    setActiveTab('with-tk')
    // If a recent timekeeping import happened for this month, auto-categorize from live data
    const imported = getImportFlag(selectedMonth)
    if (imported) {
      setHasCategorized(true)
      setCategorizeSource('import')
      void loadTkLists(selectedMonth)
      return
    }
    // Otherwise, if server reports the month is processed, fetch live lists.
    ;(async () => {
      const processed = await isMonthProcessed(selectedMonth)
      if (processed) {
        setHasCategorized(true)
        setCategorizeSource('payroll')
        void loadTkLists(selectedMonth)
      } else {
        setHasCategorized(false)
        setCategorizeSource(null)
        setTkLists(null)
      }
    })()
  }, [selectedMonth])

  // Listen for timekeeping imports and auto-categorize for the current month
  useEffect(() => {
    const onImported = (e: Event) => {
      if (!selectedMonth) return
      const detail = (e as CustomEvent).detail || {}
      const months: string[] = Array.isArray(detail?.months) ? detail.months : []
      const normSel = normalizeMonth(selectedMonth)
      // If event includes months, only react when it contains the selected month
      if (months.length > 0 && !months.includes(normSel)) return
      setImportFlag(normSel, true)
      setHasCategorized(true)
      setCategorizeSource('import')
      void loadTkLists(normSel)
    }
    window.addEventListener('timekeeping:imported', onImported)
    return () => window.removeEventListener('timekeeping:imported', onImported)
  }, [selectedMonth])

  const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Payroll', href: route('payroll.index') },
  ]

  // Removed Earnings/Deductions sections
  

  return (
    <>
  <Head title="Payroll" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="py-6 px-8 space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20 dark:border-primary">
                <Wallet className="h-6 w-6 text-primary dark:text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
                <p className="text-muted-foreground">Run a Payroll and track your employees</p>
              </div>
            </div>

            {/* Right side: Payroll and 13th Month Buttons */}
            <div className="flex items-center gap-4">
              {/* Run Payroll Group */}
              <div className="flex items-center gap-2">
                <PayrollMonthPicker
                  value={selectedMonth}
                  onValueChange={(val) => {
                    const norm = normalizeMonth(val)
                    setSelectedMonth(norm)
                    try { localStorage.setItem('salary.selectedMonth', norm || '') } catch {}
                  }}
                  placeholder="Select payroll month"
                />

                {/* 13th Month Button */}
              <Button
                onClick={() => setIsThirteenthMonthDialogOpen(true)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                13th Month Pay
              </Button>
                <Button
                  onClick={handleRunPayroll}
                  disabled={!selectedMonth || isRunningPayroll}
                  className="flex items-center gap-2"
                  aria-busy={isRunningPayroll}
                >
                  {isRunningPayroll ? (
                    <Spinner />
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                  {isRunningPayroll ? 'Running...' : 'Run Payroll'}
                </Button>
              </div>

            </div>
          </div>
          {/* Employee type filter removed as requested */}

          {/* Tabs: Timekeeping-based groups */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'with-tk' | 'without-tk')} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value="with-tk" disabled={!selectedMonth || !hasCategorized}>
                  {`With Timekeeping records${selectedMonth && hasCategorized && tkLists ? ` (${tkLists.with?.length || 0})` : ''}`}
                </TabsTrigger>
                <TabsTrigger value="without-tk" disabled={!selectedMonth || !hasCategorized}>
                  {`Without Timekeeping records${selectedMonth && hasCategorized && tkLists ? ` (${tkLists.without?.length || 0})` : ''}`}
                </TabsTrigger>
              </TabsList>
              {/* Search + Filter beside the tabs */}
              <PayrollSearch value={searchTerm} onChange={setSearchTerm} />
              <PayrollFilterButton value={filters} onChange={setFilters} othersRoles={othersRolesOptions} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ types: [], statuses: [], roles: [], collegeProgram: [], othersRole: '' })
                  setSearchTerm('')
                }}
                disabled={!hasAnyFilters}
              >
                Clear
              </Button>
              </div>
              {/* Removed active filters preview per request */}
            </div>

            {/* Employees WITH timekeeping records */}
            <TabsContent value="with-tk">
              {!selectedMonth ? (
                <div className="text-sm text-muted-foreground">Select a payroll month above to view employees.</div>
              ) : !hasCategorized ? (
                <div className="text-sm text-muted-foreground">Run Payroll for the selected month to categorize employees into With/Without Timekeeping tabs.</div>
              ) : loadingTkLists ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{filteredWith.length} employee(s) with timekeeping in {normalizeMonth(selectedMonth)}</div>
                  <ScrollableCardGrid height={340}>
                    {filteredWith.map(emp => (
                      <Card key={emp.id} className="p-3 border border-slate-300 dark:border-slate-700 shadow-sm min-h-[92px]">
                        <div className="text-sm font-medium mb-1">{emp.full_name || emp.name || `Employee #${emp.id}`}</div>
                        <RolesTableBadge roles={rolesToArray(emp.roles)} college_program={emp.college_program} compact />
                      </Card>
                    ))}
                  </ScrollableCardGrid>
                </div>
              )}
            </TabsContent>

            {/* Employees WITHOUT timekeeping records */}
            <TabsContent value="without-tk">
              {!selectedMonth ? (
                <div className="text-sm text-muted-foreground">Select a payroll month above to view employees.</div>
              ) : !hasCategorized ? (
                <div className="text-sm text-muted-foreground">Run Payroll for the selected month to categorize employees into With/Without Timekeeping tabs.</div>
              ) : loadingTkLists ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{filteredWithout.length} employee(s) without timekeeping in {normalizeMonth(selectedMonth)}</div>
                  <ScrollableCardGrid height={340}>
                    {filteredWithout.map(emp => (
                      <Card key={emp.id} className="p-3 border border-slate-300 dark:border-slate-700 shadow-sm min-h-[92px]">
                        <div className="text-sm font-medium mb-1">{emp.full_name || emp.name || `Employee #${emp.id}`}</div>
                        <RolesTableBadge roles={rolesToArray(emp.roles)} college_program={emp.college_program} compact />
                      </Card>
                    ))}
                  </ScrollableCardGrid>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
      {/* DIALOG COMPONENT INTEGRATION */}
      <ThirteenthMonthPayDialog
        isOpen={isThirteenthMonthDialogOpen}
        onClose={() => setIsThirteenthMonthDialogOpen(false)}
      />
    </>
  )
}