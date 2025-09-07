import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Edit3 } from "lucide-react";
import type { GroupedApproval } from "../hooks/useApprovals";

interface EmployeeApprovalDetailProps {
  employee: GroupedApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (approvalId: string) => void;
  onUpdateRating: (approvalId: string, newRating: 'high' | 'medium' | 'low', comment?: string) => void;
}

export const EmployeeApprovalDetail = ({
  employee,
  open,
  onOpenChange,
  onApprove,
  onUpdateRating
}: EmployeeApprovalDetailProps) => {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [updateComment, setUpdateComment] = useState("");
  const [newRating, setNewRating] = useState<'high' | 'medium' | 'low'>('medium');

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

  const handleUpdateRating = (ratingId: string) => {
    onUpdateRating(ratingId, newRating, updateComment);
    setUpdateComment("");
    setSelectedRating(null);
    setNewRating('medium');
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
                    onClick={() => {
                      setSelectedRating(rating.id);
                      setNewRating(rating.rating);
                    }}
                    className="flex-1"
                  >
                    <Edit3 className="mr-1 h-3 w-3" />
                    Update Rating
                  </Button>
                </div>

                {/* Update Rating Section */}
                {selectedRating === rating.id && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Update Rating:</label>
                      <Select value={newRating} onValueChange={(value) => setNewRating(value as 'high' | 'medium' | 'low')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">HIGH</SelectItem>
                          <SelectItem value="medium">MEDIUM</SelectItem>
                          <SelectItem value="low">LOW</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Add a comment explaining the rating update..."
                      value={updateComment}
                      onChange={(e) => setUpdateComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateRating(rating.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Update & Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRating(null);
                          setUpdateComment("");
                          setNewRating('medium');
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