import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckCircle, 
  Search,
  FolderKanban, 
  BarChart3, 
  Settings,
  Users,
  ChevronLeft,
  User,
  BarChart3 as SkillIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { useToast } from '@/hooks/use-toast';

const items = [
  { 
    title: 'Dashboard', 
    url: '/', 
    icon: LayoutDashboard,
    roles: ['manager', 'admin'] 
  },
  { 
    title: 'Skills', 
    url: '/skills', 
    icon: BookOpen,
    roles: ['employee', 'tech_lead', 'manager', 'admin'] 
  },
  { 
    title: 'Approvals', 
    url: '/approvals', 
    icon: CheckCircle,
    roles: ['tech_lead', 'manager', 'admin']
  },
  { 
    title: 'Skill Explorer', 
    url: '/skill-explorer', 
    icon: Search,
    roles: ['tech_lead', 'manager', 'admin']
  },
  { 
    title: 'Admin', 
    url: '/admin', 
    icon: Settings,
    roles: ['manager', 'admin'] 
  },
];

const bottomItems: any[] = [];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { pendingCount } = usePendingApprovals();
  const currentPath = location.pathname;

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };


  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-sidebar-accent text-sidebar-primary font-semibold border-r-2 border-sidebar-primary' 
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground';

  const canAccessItem = (itemRoles?: string[]) => {
    if (!itemRoles) return true;
    return profile && itemRoles.includes(profile.role);
  };

  const filteredItems = items.filter(item => canAccessItem(item.roles));
  const filteredBottomItems = bottomItems.filter(item => canAccessItem(item.roles));

return (
    <div 
      className="h-screen flex flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300 ease-in-out"
      style={{ 
        width: collapsed ? '64px' : '200px',
        minWidth: collapsed ? '64px' : '200px',
        maxWidth: collapsed ? '64px' : '200px'
      }}
    >
      {/* Logo */}
      <div className="flex items-center border-b border-sidebar-border h-16">
        <div className="flex items-center w-full pl-3 pr-3">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img 
              src="/lovable-uploads/54adcce8-be73-4135-bb3c-fb8fd83846cf.png" 
              alt="Logo" 
              className="h-8 w-8" 
            />
          </div>
          <div 
            className={`ml-0 text-sidebar-foreground font-semibold text-base whitespace-nowrap transition-all duration-300 overflow-hidden ${
              collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            }`}
          >
            RealThingks
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {filteredItems.map((item) => {
            const active = isActive(item.url);
            const menuButton = (
              <NavLink
                to={item.url}
                end={item.url === '/'}
                className={`
                  flex items-center h-10 rounded-lg relative transition-colors duration-200 font-medium
                  ${active 
                    ? 'text-sidebar-primary bg-sidebar-accent border-r-2 border-sidebar-primary' 
                    : 'text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div 
                  className={`transition-all duration-300 overflow-hidden whitespace-nowrap flex items-center justify-between flex-1 ${
                    collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-0'
                  }`}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.title === 'Approvals' && pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-sidebar-accent text-sidebar-foreground/70 flex-shrink-0">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </NavLink>
            );

            if (collapsed) {
              return (
                <TooltipProvider key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {menuButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return <div key={item.title}>{menuButton}</div>;
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">

        {/* Collapse Toggle */}
        <div>
          {(() => {
            const collapseButton = (
              <button
                onClick={toggleSidebar}
                className="flex items-center h-10 w-full rounded-lg transition-colors font-medium text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
              >
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </div>
                <div 
                  className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-0'
                  }`}
                >
                  <span className="text-sm font-medium">Collapse</span>
                </div>
              </button>
            );

            if (collapsed) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {collapseButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <p>Expand sidebar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return collapseButton;
          })()}
        </div>

        {/* User Profile & Logout */}
        <div>
          {(() => {
            const handleLogout = async () => {
              try {
                await signOut();
                toast({
                  title: "Logged out successfully",
                  description: "You have been logged out of your account.",
                });
                navigate('/auth', { replace: true });
              } catch (error) {
                console.error('Logout error:', error);
                toast({
                  title: "Logout failed",
                  description: "Please try again.",
                  variant: "destructive",
                });
              }
            };

            const displayName = profile?.full_name || profile?.email || 'User';
            const profileButton = (
              <button 
                onClick={handleLogout}
                className="flex items-center h-10 w-full rounded-lg transition-colors font-medium text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
              >
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div 
                  className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-0'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium truncate max-w-32">{displayName}</div>
                    <div className="text-xs text-sidebar-foreground/50"></div>
                  </div>
                </div>
              </button>
            );

            if (collapsed) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {profileButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="text-center">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground"></p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return profileButton;
          })()}
        </div>
      </div>
    </div>
  );
}