import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle, XCircle, Search, Filter, Users } from "lucide-react";
import { useApprovals, type GroupedApproval } from "./hooks/useApprovals";
import { EmployeeApprovalDetail } from "./components/EmployeeApprovalDetail";
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
    handleUpdateRating 
  } = useApprovals();

  const [selectedEmployee, setSelectedEmployee] = useState<GroupedApproval | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filter grouped approvals based on search term
  const filteredGroupedApprovals = groupedApprovals.filter(group => 
    group.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highPriorityCount = pendingApprovals.filter(a => a.priority === 'High').length;

  const handleEmployeeClick = (employee: GroupedApproval) => {
    setSelectedEmployee(employee);
    setDetailOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and manage pending approval requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">{highPriorityCount} high priority</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActions.length}</div>
            <p className="text-xs text-muted-foreground">Recent approvals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <XCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5d</div>
            <p className="text-xs text-muted-foreground">-0.5d improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
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
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredGroupedApprovals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No employees match your search.' : 'No pending approvals at this time.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroupedApprovals.map((employee) => (
                  <div 
                    key={employee.employeeId} 
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleEmployeeClick(employee)}
                  >
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Recently processed approval requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By: {action.approver} • {action.date}
                    </p>
                  </div>
                  <Badge className={getActionColor(action.action)}>
                    {action.action}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Detail Modal */}
        <EmployeeApprovalDetail
          employee={selectedEmployee}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onApprove={handleApproveRating}
          onUpdateRating={handleUpdateRating}
        />
    </div>
  );
};

export default Approvals;