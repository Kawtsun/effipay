import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Employees } from "@/types";
import { formatFullName } from "@/utils/formatFullName";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MonthPicker } from "./ui/month-picker";

function formatWithCommas(value: string) {
  if (!value) return "";
  const [int, dec] = value.split(".");
  return dec !== undefined
    ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec
    : int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface Props {
  employee: Employees | null;
  open: boolean;
  onClose: () => void;
  month: string;
  onMonthChange: (month: string) => void;
}

export default function AdjustmentDialog({
  employee,
  open,
  onClose,
  month,
  onMonthChange,
}: Props) {
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [amount, setAmount] = useState("");
  const employeeName = employee
    ? formatFullName(employee.last_name, employee.first_name, employee.middle_name)
    : "";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Remove non-numeric characters except for the decimal point
    const sanitized = rawValue.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    // Ensure only one decimal point is present
    const finalValue = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : parts[0];
    setAmount(finalValue);
  };

  const handleSubmit = async () => {
    if (!employee || !amount) {
      toast.error("Please enter an amount.");
      return;
    }

    // Read CSRF token from meta tag (web routes require CSRF)
    const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const csrfToken = tokenMeta ? tokenMeta.content : null;

    try {
      const res = await fetch('/payrolls/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          employee_id: employee.id,
          month: month,
          amount: parseFloat(amount.replace(/,/g, '')),
          type: adjustmentType,
        }),
      });

      const data = await res.json();

      // If CSRF/session expired or method not allowed, reload to recover session/routes
      if (res.status === 419 || res.status === 401) {
        toast.error('Session expired. The page will reload to recover your session.');
        window.setTimeout(() => window.location.reload(), 1200);
        return;
      }

      // Method not allowed (route mismatch) — reload to ensure route cache / server state is fresh
      if (res.status === 405) {
        toast.error('Server route mismatch detected. Reloading the page to refresh routes.');
        window.setTimeout(() => window.location.reload(), 1200);
        return;
      }

      if (!res.ok) {
        const message = data && data.message ? data.message : 'Failed to apply adjustment.';
        toast.error(message);
        return;
      }

      toast.success(data.message || 'Adjustment applied successfully.');
      onClose();
      // Optionally, refresh the page or refetch reports data here using Inertia or provided callback
    } catch (err) {
      console.error(err);
      // Network error or unexpected exception — reload to recover session/state
      toast.error('Network or session error occurred. The page will reload to try to recover.');
      window.setTimeout(() => window.location.reload(), 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjustments for {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Adjustment Type</p>
              <RadioGroup
                defaultValue="add"
                value={adjustmentType}
                onValueChange={setAdjustmentType}
                className="flex items-center space-x-4 mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="r1" />
                  <Label htmlFor="r1">Add</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deduct" id="r2" />
                  <Label htmlFor="r2">Deduct</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="adjustment-month">Month</Label>
              <MonthPicker
                value={month}
                onValueChange={onMonthChange}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="adjustment-amount">Amount</Label>
            <Input
              id="adjustment-amount"
              type="text"
              placeholder="Enter amount"
              value={formatWithCommas(amount)}
              onChange={handleAmountChange}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
