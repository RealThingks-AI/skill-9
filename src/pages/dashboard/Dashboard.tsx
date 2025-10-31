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
    return <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>;
  }
  if (!canAccessDashboard) {
    return <div className="h-full flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
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