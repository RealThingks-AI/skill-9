import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PendingRating {
  id: string;
  skill_name: string;
  subskill_name?: string;
  rating: 'high' | 'medium' | 'low';
  submitted_at: string;
  self_comment?: string;
}

interface PendingRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

export const PendingRatingsModal = ({ isOpen, onClose, categoryId, categoryName }: PendingRatingsModalProps) => {
  const [ratings, setRatings] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const getRatingColor = (rating: 'high' | 'medium' | 'low') => {
    switch (rating) {
      case 'high': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRatingIcon = (rating: 'high' | 'medium' | 'low') => {
    switch (rating) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
    }
  };

  const fetchPendingRatings = async () => {
    if (!profile?.user_id || !categoryId) return;

    try {
      setLoading(true);

      // Fetch pending ratings for this category
      const { data: ratingsData, error } = await supabase
        .from('employee_ratings')
        .select(`
          id,
          rating,
          submitted_at,
          self_comment,
          skill_id,
          subskill_id,
          skills!inner(name, category_id),
          subskills(name)
        `)
        .eq('user_id', profile.user_id)
        .eq('status', 'submitted')
        .eq('skills.category_id', categoryId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formattedRatings: PendingRating[] = ratingsData?.map(rating => ({
        id: rating.id,
        skill_name: rating.skills?.name || '',
        subskill_name: rating.subskills?.name,
        rating: rating.rating as 'high' | 'medium' | 'low',
        submitted_at: rating.submitted_at,
        self_comment: rating.self_comment
      })) || [];

      setRatings(formattedRatings);
    } catch (error) {
      console.error('Error fetching pending ratings:', error);
      toast({
        title: "Error",
        description: "Failed to load pending ratings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && categoryId) {
      fetchPendingRatings();
    }
  }, [isOpen, categoryId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            {categoryName} - Pending Approval
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading pending ratings...</p>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending ratings found for this category
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div key={rating.id} className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {rating.skill_name}
                          {rating.subskill_name && (
                            <span className="text-muted-foreground font-normal">
                              {' → '}{rating.subskill_name}
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`${getRatingColor(rating.rating)} font-medium`}
                          >
                            {getRatingIcon(rating.rating)} {rating.rating.charAt(0).toUpperCase() + rating.rating.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Submitted {format(new Date(rating.submitted_at), 'MMM dd, yyyy')}
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            Pending Approval
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {rating.self_comment && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Your comment:</strong> {rating.self_comment}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};