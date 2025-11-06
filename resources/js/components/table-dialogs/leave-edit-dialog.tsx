import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import type { Employees } from '@/types'

export type LeaveRow = {
  id: number
  status: string
  leave_start_day: string
  leave_end_day: string | null
}

const STATUS_OPTIONS = [
  'Sick Leave',
  'Vacation Leave',
  'Paid Leave',
  'Maternity Leave',
  'Study Leave',
]

function toISO(d?: string | null) {
  if (!d) return ''
  return d.slice(0, 10)
}

interface Props {
  employee: Employees | null
  onClose: () => void
}

export default function LeaveEditDialog({ employee, onClose }: Props) {
  const [rows, setRows] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<LeaveRow | null>(null)
  const [saving, setSaving] = useState(false)

  const csrfToken = useMemo(() => document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || '', [])

  useEffect(() => {
    if (!employee) return
    setLoading(true)
    fetch(`/api/leaves?employee_id=${employee.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch leaves')
        const json = await res.json()
        setRows(Array.isArray(json.leaves) ? json.leaves : [])
      })
      .catch((e) => {
        console.error(e)
        toast.error('Unable to fetch leave dates.')
      })
      .finally(() => setLoading(false))
  }, [employee])

  const resetForm = () => setEditing(null)

  const handleEdit = (row: LeaveRow) => {
    setEditing({ ...row, leave_start_day: toISO(row.leave_start_day), leave_end_day: row.leave_end_day ? toISO(row.leave_end_day) : null })
  }

  const handleDelete = async (row: LeaveRow) => {
    if (!confirm('Delete this leave entry?')) return
    try {
      const res = await fetch('/api/leaves/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ leave_id: row.id }),
      })
      if (!res.ok) throw new Error('Failed to delete leave')
      toast.success('Leave deleted')
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      if (editing?.id === row.id) resetForm()
    } catch (e) {
      toast.error('Failed to delete leave')
    }
  }

  const handleSave = async () => {
    if (!employee || !editing) return
    if (!editing.status || !editing.leave_start_day) {
      toast.error('Please select status and start date')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/leaves/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({
          leave_id: editing.id || undefined,
          employee_id: employee.id,
          status: editing.status,
          leave_start_day: toISO(editing.leave_start_day),
          leave_end_day: editing.leave_end_day ? toISO(editing.leave_end_day) : null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const json = await res.json()
      const saved: LeaveRow | undefined = json.leave
      if (saved) {
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === saved.id)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = saved
            return copy
          }
          return [saved, ...prev]
        })
        toast.success('Saved leave dates')
        resetForm()
      } else {
        toast.success('Saved')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to save leave')
    } finally {
      setSaving(false)
    }
  }

  const startNew = () => setEditing({ id: 0, status: '', leave_start_day: '', leave_end_day: null })

  return (
    <Dialog open={!!employee} onOpenChange={(v) => !v && onClose()}>
      {!!employee && (
        <DialogContent overlayClassName="z-[120]" className="max-w-3xl w-full px-8 py-6 z-[130] flex flex-col min-h-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Leave Dates</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-4">
            {employee.last_name}, {employee.first_name} — ID {employee.id}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={editing?.status || ''} onValueChange={(v) => setEditing((e) => (e ? { ...e, status: v } : e))}>
                <SelectTrigger className="mt-1" disabled={!editing}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:block" />
            <div>
              <Label>Start Date</Label>
              <div className="mt-1">
                <DatePicker 
                  value={editing?.leave_start_day || ''}
                  onValueChange={(v) => setEditing((e) => (e ? { ...e, leave_start_day: v } : e))}
                  disabled={() => false}
                  isDisabled={!editing}
                />
              </div>
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <div className="mt-1">
                <DatePicker 
                  value={editing?.leave_end_day || ''}
                  onValueChange={(v) => setEditing((e) => (e ? { ...e, leave_end_day: v } : e))}
                  disabled={() => false}
                  isDisabled={!editing}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!editing && (
              <Button variant="default" onClick={startNew}>New</Button>
            )}
            {editing && (
              <>
                <Button onClick={handleSave} disabled={saving}>{editing.id ? 'Update' : 'Save'}</Button>
                <Button variant="secondary" onClick={resetForm} disabled={saving}>Cancel</Button>
              </>
            )}
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Existing Leaves</div>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Start</th>
                    <th className="px-3 py-2 text-left">End</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No leave entries yet.</td></tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{toISO(r.leave_start_day)}</td>
                        <td className="px-3 py-2">{toISO(r.leave_end_day)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(r)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(r)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
