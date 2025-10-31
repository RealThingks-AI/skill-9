import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useTechLeadStats, type TechLeadStats } from "../hooks/useTechLeadStats";
import { TechLeadDetailModal } from "./TechLeadDetailModal";
interface TechLeadStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const TechLeadStatsModal = ({
  open,
  onOpenChange
}: TechLeadStatsModalProps) => {
  const {
    techLeadStats,
    loading
  } = useTechLeadStats();
  const [selectedTechLead, setSelectedTechLead] = useState<TechLeadStats | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const handleTechLeadClick = (techLead: TechLeadStats) => {
    setSelectedTechLead(techLead);
    setDetailModalOpen(true);
  };
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Tech Lead Actions</DialogTitle>
          </DialogHeader>

          {loading ? <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div> : techLeadStats.length === 0 ? <div className="text-center py-12 text-muted-foreground">
              No tech lead actions found
            </div> : <ScrollArea className="h-[calc(85vh-120px)]">
              <div className="space-y-3 pr-4">
                {techLeadStats.map(techLead => <div key={techLead.techLeadId} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleTechLeadClick(techLead)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-base">{techLead.techLeadName}</h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {techLead.totalReviews} Total Reviews
                          </Badge>
                        </div>
                        
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{techLead.approvedCount} Approved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">{techLead.rejectedCount} Rejected</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>)}
              </div>
            </ScrollArea>}
        </DialogContent>
      </Dialog>

      {selectedTechLead && <TechLeadDetailModal open={detailModalOpen} onOpenChange={setDetailModalOpen} techLead={selectedTechLead} />}
    </>;
};