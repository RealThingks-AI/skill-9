import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { SkillMetersCard } from "./components/SkillMetersCard";
import { GamificationCard } from "./components/GamificationCard";
import { LeaderboardCard } from "./components/LeaderboardCard";
const Dashboard = () => {
  const {
    profile
  } = useAuth();
  console.log('Profile data:', profile); // Debug log
  const canAccessDashboard = false; // Dashboard removed for all user roles
  if (!profile) {
    return <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>;
  }
  if (!canAccessDashboard) {
    return <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Management dashboard features coming soon
          </p>
        </div>
      </div>;
  }
  return <div className="h-full overflow-hidden p-3">
      {/* Optimized Two-Column Layout */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-4 h-full">
        {/* Left Column - Skill Progress (Full Height) */}
        <div className="lg:col-span-3 h-full">
          <SkillMetersCard />
        </div>
        
        {/* Right Column - XP & Leaderboard */}
        <div className="flex flex-col gap-4 h-full">
          {/* XP & Achievements */}
          <div className="flex-shrink-0">
            <GamificationCard />
          </div>
          
          {/* Leaderboard */}
          <div className="flex-1 min-h-0">
            <LeaderboardCard />
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;