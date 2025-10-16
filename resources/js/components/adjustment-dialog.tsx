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
}

export default function AdjustmentDialog({ employee, open, onClose }: Props) {
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

  const handleSubmit = () => {
    if (!employee || !amount) {
      toast.error("Please enter an amount.");
      return;
    }
    const action = adjustmentType === "add" ? "added" : "deducted";
    const formattedAmount = formatWithCommas(amount);
    toast.success(`${employeeName} was ${action} ${formattedAmount}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjustments for {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Adjustment Type</p>
            <RadioGroup
              defaultValue="add"
              value={adjustmentType}
              onValueChange={setAdjustmentType}
              className="flex items-center space-x-4"
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
