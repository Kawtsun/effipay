import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Wallet, Calculator, TrendingUp } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

// shadcn Card imports
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ThirteenthMonthPayDialog from '@/components/thirtheen-month-pay-dialog'
import { PayrollMonthPicker } from '@/components/ui/payroll-month-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RolesTableBadge } from '@/components/roles-table-badge'
import { ScrollableCardGrid } from '../../components/scrollable-card-grid'

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
    router.post(
      route('payroll.run'),
      { payroll_date: selectedMonth },
      {
        preserveState: false,
        onSuccess: () => {
          // After running payroll, refresh the timekeeping lists and focus the tab
          setActiveTab('with-tk')
          // Trigger list reload by resetting to same value to force effect; or call loader directly
          // We'll call the loader directly via a helper
          void loadTkLists(selectedMonth)
        },
        onFinish: () => setIsRunningPayroll(false),
      }
    )
  }, [selectedMonth])

  // Helper to fetch employees with/without timekeeping
  const loadTkLists = async (month: string) => {
    const norm = normalizeMonth(month)
    if (!norm || !/^\d{4}-\d{2}$/.test(norm)) { setTkLists(null); return }
    setLoadingTkLists(true)
    try {
      const res = await fetch(`/api/timekeeping/employees-by-month?month=${encodeURIComponent(norm)}`)
      if (res.ok) {
        const data = await res.json()
        setTkLists({ with: data.with || [], without: data.without || [] })
      } else {
        setTkLists({ with: [], without: [] })
      }
    } catch {
      setTkLists({ with: [], without: [] })
    } finally {
      setLoadingTkLists(false)
    }
  }
  // Parse roles into an array for the RolesTableBadge
  const rolesToArray = (roles?: string | string[]): string[] => {
    if (!roles) return []
    if (Array.isArray(roles)) return roles
    return roles.split(',').map(r => r.trim()).filter(Boolean)
  }

  // Fetch employees with/without timekeeping for the selected month
  useEffect(() => {
    if (!selectedMonth) { setTkLists(null); return }
    setActiveTab('with-tk')
    void loadTkLists(selectedMonth)
  }, [selectedMonth])

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Salary Management', href: route('salary.index') },
  ]

  // Removed Earnings/Deductions sections
  

  return (
    <>
      <Head title="Salary Management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="py-6 px-8 space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20 dark:border-primary">
                <Wallet className="h-6 w-6 text-primary dark:text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Salary Management</h1>
                <p className="text-muted-foreground">Set default salary values by employee type and run payroll.</p>
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
              <TabsList>
                <TabsTrigger value="with-tk" disabled={!selectedMonth}>
                  {`With Timekeeping records${selectedMonth && tkLists ? ` (${tkLists.with?.length || 0})` : ''}`}
                </TabsTrigger>
                <TabsTrigger value="without-tk" disabled={!selectedMonth}>
                  {`Without Timekeeping records${selectedMonth && tkLists ? ` (${tkLists.without?.length || 0})` : ''}`}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Employees WITH timekeeping records */}
            <TabsContent value="with-tk">
              {!selectedMonth ? (
                <div className="text-sm text-muted-foreground">Select a payroll month above to view employees.</div>
              ) : loadingTkLists ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{tkLists?.with?.length || 0} employee(s) with timekeeping in {normalizeMonth(selectedMonth)}</div>
                  <ScrollableCardGrid height={340}>
                    {(tkLists?.with || []).map(emp => (
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
              ) : loadingTkLists ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{tkLists?.without?.length || 0} employee(s) without timekeeping in {normalizeMonth(selectedMonth)}</div>
                  <ScrollableCardGrid height={340}>
                    {(tkLists?.without || []).map(emp => (
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