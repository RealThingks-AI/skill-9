import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { GroupedHistoricalApproval } from "../hooks/useApprovalHistory";
import { EmployeeHistoryDetail } from "./EmployeeHistoryDetail";

interface ApprovalHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedHistory: GroupedHistoricalApproval[];
}

export const ApprovalHistoryModal = ({
  open,
  onOpenChange,
  groupedHistory
}: ApprovalHistoryModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<GroupedHistoricalApproval | null>(null);

  const filteredHistory = groupedHistory.filter(employee =>
    employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !selectedEmployee} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Approval History</DialogTitle>
            <DialogDescription>
              View all employees with approved or rejected skill ratings
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Employee List */}
          <ScrollArea className="h-[50vh]">
            <div className="space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approval history found
                </div>
              ) : (
                filteredHistory.map((employee) => (
                  <Button
                    key={employee.userId}
                    variant="outline"
                    className="w-full justify-between h-auto p-4"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">{employee.employeeName}</span>
                      <span className="text-xs text-muted-foreground">{employee.employeeEmail}</span>
                    </div>
                    <Badge variant="secondary">
                      {employee.totalCount} rating{employee.totalCount > 1 ? 's' : ''}
                    </Badge>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <EmployeeHistoryDetail
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployee(null);
        }}
      />
    </>
  );
};
