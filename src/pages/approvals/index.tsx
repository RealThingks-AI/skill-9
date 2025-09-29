import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Users, User, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useApprovals, type GroupedApproval } from "./hooks/useApprovals";
import { PendingApprovalsStats } from "./components/PendingApprovalsStats";
import { ApprovedTodayStats } from "./components/ApprovedTodayStats";
import { RejectedTodayStats } from "./components/RejectedTodayStats";
import { PendingApprovalsList } from "./components/PendingApprovalsList";
import { ApprovedActionsList } from "./components/ApprovedActionsList";
import { RejectedActionsList } from "./components/RejectedActionsList";
import { EmployeesList } from "./components/EmployeesList";
import { EmployeeHistoryDetail } from "./components/EmployeeHistoryDetail";
import { useAuth } from "@/hooks/useAuth";
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
  const {
    profile
  } = useAuth();
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [pendingListOpen, setPendingListOpen] = useState(false);
  const [approvedListOpen, setApprovedListOpen] = useState(false);
  const [rejectedListOpen, setRejectedListOpen] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<any>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showApproveFor, setShowApproveFor] = useState<string | null>(null);
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  // Filter grouped approvals based on search term
  const filteredGroupedApprovals = groupedApprovals.filter(group => group.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || group.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const highPriorityCount = pendingApprovals.filter(a => a.priority === 'High').length;
  const handleEmployeeToggle = (employee: GroupedApproval) => {
    setExpandedEmployeeId(prev => prev === employee.employeeId ? null : employee.employeeId);
    setShowApproveFor(null);
    setShowRejectFor(null);
    setApproveComment("");
    setRejectComment("");
  };
  const handleEmployeeHistoryClick = (employee: any) => {
    setSelectedEmployeeForHistory(employee);
    setHistoryDetailOpen(true);
  };
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
  return <div className="min-h-screen w-full p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Approvals Dashboard</h1>
          
        </div>
        
        {/* Search - Top Right */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10" />
          </div>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500" onClick={() => setPendingListOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingApprovals.length}</div>
            
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500" onClick={() => setApprovedListOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{getApprovedTodayCount()}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully reviewed</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500" onClick={() => setRejectedListOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Today</CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{getRejectedTodayCount()}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs revision</p>
          </CardContent>
        </Card>
      </div>


      <div className="space-y-6">
        {/* Pending Approvals - Full Width */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Approvals
            </CardTitle>
            
          </CardHeader>
          <CardContent className="w-full">
            {loading ? <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div> : filteredGroupedApprovals.length === 0 ? <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No employees match your search.' : 'All caught up! No pending approvals.'}
                </p>
              </div> : <div className="space-y-2 w-full overflow-y-auto max-h-[600px]">
                {filteredGroupedApprovals.map(employee => <Collapsible key={employee.employeeId} open={expandedEmployeeId === employee.employeeId} onOpenChange={open => {
              setExpandedEmployeeId(open ? employee.employeeId : null);
              setShowApproveFor(null);
              setShowRejectFor(null);
              setApproveComment("");
              setRejectComment("");
            }}>
                    <div className="border rounded-lg overflow-hidden w-full">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer group w-full">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="font-medium text-sm min-w-[120px]">{employee.employeeName}</div>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs whitespace-nowrap">
                              {employee.pendingCount} Rating{employee.pendingCount > 1 ? 's' : ''}
                            </Badge>
                            <div className="text-sm text-muted-foreground truncate flex-1">{employee.email}</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                              Submitted: {employee.submitDate}
                            </div>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 ml-4 whitespace-nowrap" onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedEmployeeId(expandedEmployeeId === employee.employeeId ? null : employee.employeeId);
                    }}>
                            Review
                          </Button>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="border-t bg-muted/20 w-full">
                        <div className="p-4 space-y-4 w-full">
                          {/* Individual Ratings */}
                          <div className="space-y-3">
                            {employee.ratings.map(rating => <div key={rating.id} className="border rounded-lg p-4 w-full">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="space-y-1 flex-1">
                                    <h4 className="font-medium">{rating.title}</h4>
                                    {rating.self_comment && <div className="mt-2 p-2 bg-muted rounded text-sm">
                                        <strong>Employee comment:</strong> {rating.self_comment}
                                      </div>}
                                  </div>
                                  <Badge className={getRatingColor(rating.rating)}>
                                    {rating.rating.toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => {
                            setShowRejectFor(null);
                            setShowApproveFor(showApproveFor === rating.id ? null : rating.id);
                          }} className="px-4 py-2">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => {
                            setShowApproveFor(null);
                            setShowRejectFor(showRejectFor === rating.id ? null : rating.id);
                          }} className="px-4 py-2">
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>

                                {/* Approve Comment Section */}
                                {showApproveFor === rating.id && <div className="mt-3 space-y-3 p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <Label className="text-sm font-medium text-green-800">Approve Rating - Optional Comment</Label>
                                    </div>
                                    <Textarea placeholder="Add an optional comment for this approval..." value={approveComment} onChange={e => setApproveComment(e.target.value)} className="min-h-[80px]" />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={async () => {
                              await handleApproveRating(rating.id, approveComment);
                              setApproveComment("");
                              setShowApproveFor(null);
                            }} className="bg-green-600 hover:bg-green-700">
                                        Confirm Approval
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => {
                              setShowApproveFor(null);
                              setApproveComment("");
                            }}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>}

                                {/* Reject Comment Section */}
                                {showRejectFor === rating.id && <div className="mt-3 space-y-3 p-3 bg-red-50 border border-red-200 rounded">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      <Label className="text-sm font-medium text-red-800">Reject Rating - Comment Required</Label>
                                    </div>
                                    <Textarea placeholder="Please provide a detailed explanation for rejecting this rating..." value={rejectComment} onChange={e => setRejectComment(e.target.value)} className="min-h-[80px]" required />
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="destructive" onClick={async () => {
                              if (!rejectComment.trim()) return;
                              await handleRejectRating(rating.id, rejectComment);
                              setRejectComment("");
                              setShowRejectFor(null);
                            }} disabled={!rejectComment.trim()}>
                                        Confirm Rejection
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => {
                              setShowRejectFor(null);
                              setRejectComment("");
                            }}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>}
                              </div>)}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>)}
              </div>}
          </CardContent>
        </Card>

        {/* Team Directory - Only visible to management and admin */}
        {profile?.role && ['management', 'admin'].includes(profile.role) && <EmployeesList onEmployeeClick={handleEmployeeHistoryClick} roleFilter={roleFilter} searchTerm={searchTerm} />}
      </div>

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