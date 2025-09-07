import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import type { GroupedApproval } from "../hooks/useApprovals";

interface EmployeeApprovalDetailProps {
  employee: GroupedApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string, comment?: string) => void;
}

export const EmployeeApprovalDetail = ({
  employee,
  open,
  onOpenChange,
  onApprove,
  onReject
}: EmployeeApprovalDetailProps) => {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  if (!employee) return null;

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

  const handleBulkApprove = () => {
    employee.ratings.forEach(rating => {
      onApprove(rating.id);
    });
    onOpenChange(false);
  };

  const handleReject = (ratingId: string) => {
    onReject(ratingId, rejectComment);
    setRejectComment("");
    setSelectedRating(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Skills - {employee.employeeName}</DialogTitle>
          <DialogDescription>
            Review and approve {employee.pendingCount} pending skill rating{employee.pendingCount > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bulk Actions */}
          <div className="flex gap-2 p-4 bg-muted rounded-lg">
            <Button onClick={handleBulkApprove} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve All ({employee.pendingCount})
            </Button>
          </div>

          {/* Individual Ratings */}
          <div className="space-y-3">
            {employee.ratings.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium">{rating.title}</h4>
                    <p className="text-sm text-muted-foreground">{rating.description}</p>
                    {rating.self_comment && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <strong>Employee comment:</strong> {rating.self_comment}
                      </div>
                    )}
                  </div>
                  <Badge className={getRatingColor(rating.rating)}>
                    {rating.rating.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(rating.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRating(rating.id)}
                    className="flex-1"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Reject
                  </Button>
                </div>

                {/* Reject Comment Section */}
                {selectedRating === rating.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Add a comment explaining why this rating is being rejected..."
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(rating.id)}
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRating(null);
                          setRejectComment("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};