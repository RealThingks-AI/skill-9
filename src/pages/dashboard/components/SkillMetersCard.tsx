import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Award, ChevronRight, Star, Clock, Trophy, Code, Database, Settings, Shield, Zap, Brain, Layers, Cpu, Network, Users } from "lucide-react";
import { useSkillMeters } from "../hooks/useSkillMeters";
import { ApprovedRatingsModal } from "./ApprovedRatingsModal";
import { useAuth } from "@/hooks/useAuth";
export const SkillMetersCard = () => {
  const {
    metersData,
    loading
  } = useSkillMeters();
  const {
    user
  } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const getLevelColor = (level: 'expert' | 'on-track' | 'developing') => {
    switch (level) {
      case 'expert':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'on-track':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'developing':
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  const getLevelText = (level: 'expert' | 'on-track' | 'developing') => {
    switch (level) {
      case 'expert':
        return 'Expert';
      case 'on-track':
        return 'On Track';
      case 'developing':
        return 'Developing';
    }
  };
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('autosar') || name.includes('automotive')) return Code;
    if (name.includes('database') || name.includes('sql')) return Database;
    if (name.includes('system') || name.includes('architecture')) return Settings;
    if (name.includes('security') || name.includes('crypto')) return Shield;
    if (name.includes('performance') || name.includes('optimization')) return Zap;
    if (name.includes('ai') || name.includes('machine') || name.includes('algorithm')) return Brain;
    if (name.includes('network') || name.includes('protocol')) return Network;
    if (name.includes('embedded') || name.includes('hardware')) return Cpu;
    return Layers; // Default icon
  };
  const getProgressColor = (percentage: number) => {
    // Progressive color system: Red (0-40%) -> Orange (40-60%) -> Amber (60-80%) -> Green (80%+)
    if (percentage >= 80) return 'hsl(var(--skill-high))';
    if (percentage >= 60) return 'hsl(var(--skill-medium))';
    if (percentage >= 40) return 'hsl(var(--skill-low))';
    return 'hsl(0 84% 60%)';
  };
  const getProgressGradient = (percentage: number) => {
    if (percentage >= 80) return 'linear-gradient(90deg, hsl(var(--skill-high)), hsl(155 62% 48%))';
    if (percentage >= 60) return 'linear-gradient(90deg, hsl(var(--skill-medium)), hsl(54 91% 46%))';
    if (percentage >= 40) return 'linear-gradient(90deg, hsl(var(--skill-low)), hsl(38 92% 50%))';
    return 'linear-gradient(90deg, hsl(0 84% 60%), hsl(14 91% 54%))';
  };
  const getCardTintColor = (percentage: number) => {
    // Card background tint based on progress: 0% red → 100% green
    if (percentage >= 80) return 'bg-green-50/80 border-green-200/60';
    if (percentage >= 60) return 'bg-amber-50/80 border-amber-200/60';
    if (percentage >= 40) return 'bg-orange-50/80 border-orange-200/60';
    if (percentage > 0) return 'bg-red-50/80 border-red-200/60';
    return 'bg-slate-50/80 border-slate-200/60'; // No progress
  };
  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Not updated yet';
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };
  const isTeachLead = user?.role === 'tech_lead';
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Skill Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading skill meters...</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skill Progress
            </CardTitle>
          </div>
          {metersData.overallGrowth > 0 && <div className="text-right">
              {/* Growth indicator */}
            </div>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Overall Summary */}
        {metersData.xpGained > 0 && <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">+{metersData.xpGained} XP Earned</span>
              </div>
              {metersData.badges.length > 0 && <Badge variant="outline" className="text-primary border-primary/30">
                  {metersData.badges.length} new badge{metersData.badges.length > 1 ? 's' : ''}
                </Badge>}
            </div>
          </div>}

        {/* Category Meters */}
        {metersData.categoryMeters.length === 0 ? <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Target className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No skill categories found</p>
              <p className="text-xs text-muted-foreground">
                Complete skill assessments to see your progress
              </p>
            </div>
          </div> : <div className="flex-1 min-h-0 overflow-hidden">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 h-full auto-rows-fr">
              {metersData.categoryMeters.sort((a, b) => b.percentage - a.percentage).map(meter => {
            const CategoryIcon = getCategoryIcon(meter.categoryName);
            const ratedCount = meter.breakdown.high + meter.breakdown.medium + meter.breakdown.low;
            const totalSkills = ratedCount + meter.breakdown.unrated;
            const teamPending = Math.floor(Math.random() * 5); // Mock data for tech leads

            return <div key={meter.categoryId} className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={() => setSelectedCategory({
              id: meter.categoryId,
              name: meter.categoryName
            })}>
                      <Card className={`h-full ${getCardTintColor(meter.percentage)} hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden`}>
                        {/* Header */}
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {meter.categoryName}
                                </CardTitle>
                                <div className="text-xs text-muted-foreground">
                                  {totalSkills} skills
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-xs ${getLevelColor(meter.level)} font-medium shrink-0 ml-2`}>
                              {getLevelText(meter.level)}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3 flex-1 pt-0">
                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground">Progress</span>
                              <span className="text-foreground text-xl">{meter.percentage}%</span>
                            </div>
                            <div className="relative">
                              <Progress value={meter.percentage} className="h-6 bg-white/70 shadow-inner" style={{
                        '--progress-foreground': getProgressGradient(meter.percentage)
                      } as React.CSSProperties} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                
                              </div>
                            </div>
                          </div>

                          {/* Rated Summary */}
                          <div className="bg-white/50 rounded-lg p-2">
                            <div className="text-xs text-foreground mb-1">Rated Summary</div>
                            <div className="text-xs text-foreground">
                              {ratedCount}/{totalSkills} | {' '}
                              {meter.breakdown.high > 0 && <span className="text-green-600">High({meter.breakdown.high})</span>}
                              {meter.breakdown.high > 0 && (meter.breakdown.medium > 0 || meter.breakdown.low > 0) && ' • '}
                              {meter.breakdown.medium > 0 && <span className="text-amber-600">Mid({meter.breakdown.medium})</span>}
                              {meter.breakdown.medium > 0 && meter.breakdown.low > 0 && ' • '}
                              {meter.breakdown.low > 0 && <span className="text-orange-600">Low({meter.breakdown.low})</span>}
                              {meter.breakdown.unrated > 0 && <>
                                  {ratedCount > 0 && ' • '}
                                  <span className="text-muted-foreground">Unrated({meter.breakdown.unrated})</span>
                                </>}
                            </div>
                          </div>

                          {/* Updated Time & Team Pending */}
                          <div className="grid grid-cols-1 gap-2">
                            <div className="bg-white/50 rounded-lg p-2 text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Clock className="h-3 w-3 text-primary" />
                                <span className="text-xs text-foreground">Updated</span>
                              </div>
                              <p className="text-xs text-foreground">
                                {getRelativeTime()}
                              </p>
                            </div>

                            {isTeachLead && teamPending > 0 && <div className="bg-blue-50/80 border border-blue-200/60 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Users className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-700">Team Pending</span>
                                </div>
                                <p className="text-xs font-semibold text-blue-800">{teamPending}</p>
                              </div>}
                          </div>

                          {/* Breakdown Link */}
                          
                        </CardContent>
                      </Card>
                    </div>;
          })}
            </div>
          </div>}

        {/* Approved Ratings Modal */}
        <ApprovedRatingsModal isOpen={!!selectedCategory} onClose={() => setSelectedCategory(null)} categoryId={selectedCategory?.id || ''} categoryName={selectedCategory?.name || ''} />
      </CardContent>
    </Card>;
};