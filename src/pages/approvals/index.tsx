import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Users } from "lucide-react";
import { useApprovals, type GroupedApproval } from "./hooks/useApprovals";
import { EmployeeApprovalDetail } from "./components/EmployeeApprovalDetail";
import { PendingApprovalsStats } from "./components/PendingApprovalsStats";
import { ApprovedTodayStats } from "./components/ApprovedTodayStats";
import { RejectedTodayStats } from "./components/RejectedTodayStats";
import { PendingApprovalsList } from "./components/PendingApprovalsList";
import { ApprovedActionsList } from "./components/ApprovedActionsList";
import { RejectedActionsList } from "./components/RejectedActionsList";
import { EmployeesList } from "./components/EmployeesList";
import { EmployeeHistoryDetail } from "./components/EmployeeHistoryDetail";
import LoadingSpinner from "@/components/common/LoadingSpinner";
const Approvals = () => {
  const {
    searchTerm,
    setSearchTerm,
    pendingApprovals,
    groupedApprovals,
    recentActions,
    loading,
    handleApproveRating,
    handleRejectRating,
    getApprovedTodayCount,
    getRejectedTodayCount,
    getApprovedTodayActions,
    getRejectedTodayActions,
    refetch
  } = useApprovals();
  const [selectedEmployee, setSelectedEmployee] = useState<GroupedApproval | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingListOpen, setPendingListOpen] = useState(false);
  const [approvedListOpen, setApprovedListOpen] = useState(false);
  const [rejectedListOpen, setRejectedListOpen] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<any>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);

  // Filter grouped approvals based on search term
  const filteredGroupedApprovals = groupedApprovals.filter(group => group.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || group.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const highPriorityCount = pendingApprovals.filter(a => a.priority === 'High').length;
  const handleEmployeeClick = (employee: GroupedApproval) => {
    setSelectedEmployee(employee);
    setDetailOpen(true);
  };
  const handleEmployeeHistoryClick = (employee: any) => {
    setSelectedEmployeeForHistory(employee);
    setHistoryDetailOpen(true);
  };
  const handleEmployeeApprove = async (approvalId: string, comment?: string) => {
    await handleApproveRating(approvalId, comment);
    // Remove the approved rating from the current employee's list
    if (selectedEmployee) {
      const updatedRatings = selectedEmployee.ratings.filter(rating => rating.id !== approvalId);
      const updatedEmployee = {
        ...selectedEmployee,
        ratings: updatedRatings,
        pendingCount: updatedRatings.length
      };
      setSelectedEmployee(updatedEmployee);

      // Close dialog if no more ratings
      if (updatedRatings.length === 0) {
        setDetailOpen(false);
        setSelectedEmployee(null);
      }
    }
    refetch();
  };
  const handleEmployeeReject = async (approvalId: string, comment: string) => {
    await handleRejectRating(approvalId, comment);
    // Remove the rejected rating from the current employee's list
    if (selectedEmployee) {
      const updatedRatings = selectedEmployee.ratings.filter(rating => rating.id !== approvalId);
      const updatedEmployee = {
        ...selectedEmployee,
        ratings: updatedRatings,
        pendingCount: updatedRatings.length
      };
      setSelectedEmployee(updatedEmployee);

      // Close dialog if no more ratings
      if (updatedRatings.length === 0) {
        setDetailOpen(false);
        setSelectedEmployee(null);
      }
    }
    refetch();
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <PendingApprovalsStats count={pendingApprovals.length} highPriorityCount={highPriorityCount} onClick={() => setPendingListOpen(true)} />
        
        <ApprovedTodayStats count={getApprovedTodayCount()} onClick={() => setApprovedListOpen(true)} />
        
        <RejectedTodayStats count={getRejectedTodayCount()} onClick={() => setRejectedListOpen(true)} />
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by employee name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals by Employee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Approvals by Employee
            </CardTitle>
            <CardDescription>
              Review skill ratings grouped by employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div> : filteredGroupedApprovals.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No employees match your search.' : 'No pending approvals at this time.'}
              </div> : <div className="space-y-3">
                {filteredGroupedApprovals.map(employee => <div key={employee.employeeId} className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleEmployeeClick(employee)}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{employee.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {employee.submitDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          {employee.pendingCount} rating{employee.pendingCount > 1 ? 's' : ''}
                        </Badge>
                        <p className="text-xs text-muted-foreground">Click to review</p>
                      </div>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>

        {/* Employees & Tech Leads List */}
        <EmployeesList onEmployeeClick={handleEmployeeHistoryClick} />
      </div>

      {/* Employee Detail Modal */}
      <EmployeeApprovalDetail employee={selectedEmployee} open={detailOpen} onOpenChange={setDetailOpen} onApprove={handleEmployeeApprove} onReject={handleEmployeeReject} />

      {/* Pending Approvals List */}
      <PendingApprovalsList open={pendingListOpen} onOpenChange={setPendingListOpen} approvals={pendingApprovals} onApprove={id => handleApproveRating(id)} onReject={id => handleRejectRating(id, 'Rejected from pending list')} />

      {/* Approved Today List */}
      <ApprovedActionsList open={approvedListOpen} onOpenChange={setApprovedListOpen} approvedActions={getApprovedTodayActions()} />

      {/* Rejected Today List */}
      <RejectedActionsList open={rejectedListOpen} onOpenChange={setRejectedListOpen} rejectedActions={getRejectedTodayActions()} />

      {/* Employee History Detail */}
      <EmployeeHistoryDetail employee={selectedEmployeeForHistory} open={historyDetailOpen} onOpenChange={setHistoryDetailOpen} />
    </div>;
};
export default Approvals;