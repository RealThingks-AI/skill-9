import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, CheckCircle, XCircle, Search, Filter, MoreVertical, Check, X, ChevronDown, User, Calendar } from "lucide-react";
import { useState } from "react";
import { useApprovals } from "./hooks/useApprovals";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const Approvals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const { pendingApprovals, recentActions, loading, handleApproveRating, handleRejectRating } = useApprovals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate stats from data
  const stats = {
    pending: pendingApprovals?.length || 0,
    highPriority: pendingApprovals?.filter(a => a.priority === 'High')?.length || 0,
    approvedToday: recentActions?.filter(a => a.action === 'Approved' && new Date(a.date).toDateString() === new Date().toDateString())?.length || 0,
    approvedChange: "+0 from yesterday",
    avgResponseTime: "N/A",
    responseImprovement: "No data"
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
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">{stats.highPriority} high priority</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">{stats.approvedChange}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <XCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">{stats.responseImprovement}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
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

      {/* Pending Approvals - Full Width */}
      <div className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Items awaiting your review and approval
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <div className="space-y-4 w-full">
              {pendingApprovals && pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <Collapsible
                    key={approval.id}
                    open={expandedApproval === approval.id}
                    onOpenChange={(open) => setExpandedApproval(open ? approval.id : null)}
                    className="w-full"
                  >
                    <div className="border rounded-lg overflow-hidden w-full">
                      <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors text-left">
                        <div className="flex items-start justify-between w-full">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{approval.title}</p>
                              <Badge className={getPriorityColor(approval.priority)}>
                                {approval.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{approval.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="border-t bg-muted/20 w-full">
                        <div className="p-4 space-y-4 w-full">
                          {/* Employee Comment */}
                          {approval.self_comment && (
                            <div className="p-3 bg-background rounded border w-full">
                              <p className="text-sm font-medium mb-1">Employee Comment:</p>
                              <p className="text-sm text-muted-foreground">{approval.self_comment}</p>
                            </div>
                          )}
                          
                          {/* Request Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm w-full">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Requester:</span>
                              <span className="font-medium">{approval.requester}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Submitted:</span>
                              <span className="font-medium">{approval.submitDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Due:</span>
                              <span className="font-medium">{approval.dueDate}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm"
                              onClick={() => handleApproveRating(approval.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectRating(approval.id, "Rejected from dropdown")}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No pending approvals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
          <CardDescription>
            Recently processed approval requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActions && recentActions.length > 0 ? (
              recentActions.map((action) => (
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
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No recent actions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Approvals;