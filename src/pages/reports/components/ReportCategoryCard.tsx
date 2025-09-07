import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import type { ReportCategory } from "../types/reports";

interface ReportCategoryCardProps {
  category: ReportCategory;
  icon: LucideIcon;
  onGenerateReport?: (reportName: string) => void;
}

export const ReportCategoryCard = ({ category, icon: Icon, onGenerateReport }: ReportCategoryCardProps) => {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${category.color}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{category.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
        
        <div className="space-y-2">
          {category.reports.map((report, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{report}</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onGenerateReport?.(report)}
              >
                Generate
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};