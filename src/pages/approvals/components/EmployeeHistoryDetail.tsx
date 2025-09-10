import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface Employee {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
}

interface Rating {
  id: string;
  skill_name: string;
  subskill_name?: string;
  rating: string;
  status: string;
  self_comment?: string;
  approver_comment?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by_name?: string;
  created_at: string;
}

interface EmployeeHistoryDetailProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeHistoryDetail = ({ 
  employee, 
  open, 
  onOpenChange 
}: EmployeeHistoryDetailProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee || !open) return;

    const fetchEmployeeHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employee_ratings')
          .select(`
            *,
            skills (name),
            subskills (name)
          `)
          .eq('user_id', employee.user_id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get approver names
        const approverIds = data?.map(r => r.approved_by).filter(Boolean) || [];
        let approvers: any[] = [];
        
        if (approverIds.length > 0) {
          const { data: approverData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', approverIds);
          approvers = approverData || [];
        }

        const formattedRatings: Rating[] = data?.map(rating => {
          const approver = approvers.find(a => a.user_id === rating.approved_by);
          return {
            id: rating.id,
            skill_name: rating.skills?.name || 'Unknown Skill',
            subskill_name: rating.subskills?.name,
            rating: rating.rating,
            status: rating.status,
            self_comment: rating.self_comment,
            approver_comment: rating.approver_comment,
            submitted_at: rating.submitted_at,
            approved_at: rating.approved_at,
            approved_by_name: approver?.full_name,
            created_at: rating.created_at
          };
        }) || [];

        setRatings(formattedRatings);
      } catch (error) {
        console.error('Error fetching employee history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeHistory();
  }, [employee, open]);

  if (!employee) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingRatings = ratings.filter(r => r.status === 'submitted');
  const approvedRatings = ratings.filter(r => r.status === 'approved');
  const rejectedRatings = ratings.filter(r => r.status === 'rejected');
  const draftRatings = ratings.filter(r => r.status === 'draft');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {employee.full_name} - Rating History
          </DialogTitle>
          <DialogDescription>
            Complete skill assessment history and details for {employee.email}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({ratings.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingRatings.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRatings.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRatings.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft ({draftRatings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <RatingsList ratings={ratings} getStatusColor={getStatusColor} getRatingColor={getRatingColor} getStatusIcon={getStatusIcon} />
            </TabsContent>

            <TabsContent value="pending">
              <RatingsList ratings={pendingRatings} getStatusColor={getStatusColor} getRatingColor={getRatingColor} getStatusIcon={getStatusIcon} />
            </TabsContent>

            <TabsContent value="approved">
              <RatingsList ratings={approvedRatings} getStatusColor={getStatusColor} getRatingColor={getRatingColor} getStatusIcon={getStatusIcon} />
            </TabsContent>

            <TabsContent value="rejected">
              <RatingsList ratings={rejectedRatings} getStatusColor={getStatusColor} getRatingColor={getRatingColor} getStatusIcon={getStatusIcon} />
            </TabsContent>

            <TabsContent value="draft">
              <RatingsList ratings={draftRatings} getStatusColor={getStatusColor} getRatingColor={getRatingColor} getStatusIcon={getStatusIcon} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface RatingsListProps {
  ratings: Rating[];
  getStatusColor: (status: string) => string;
  getRatingColor: (rating: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const RatingsList = ({ ratings, getStatusColor, getRatingColor, getStatusIcon }: RatingsListProps) => {
  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No ratings found in this category.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating) => (
        <Card key={rating.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(rating.status)}
                {rating.skill_name}
                {rating.subskill_name && ` - ${rating.subskill_name}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getRatingColor(rating.rating)}>
                  {rating.rating.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(rating.status)}>
                  {rating.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {rating.self_comment && (
              <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                <strong>Employee comment:</strong> {rating.self_comment}
              </div>
            )}
            
            {rating.approver_comment && (
              <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                <strong>Approver comment:</strong> {rating.approver_comment}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {new Date(rating.created_at).toLocaleDateString()}
              </div>
              
              {rating.submitted_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Submitted: {new Date(rating.submitted_at).toLocaleDateString()}
                </div>
              )}
              
              {rating.approved_at && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {rating.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(rating.approved_at).toLocaleDateString()}
                </div>
              )}
              
              {rating.approved_by_name && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  By: {rating.approved_by_name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};