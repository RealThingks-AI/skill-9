import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Team Members",
      value: "24",
      change: "+3 this month",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Skills Tracked",
      value: "156",
      change: "+12 new skills",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Completed Assessments",
      value: "89%",
      change: "+5% from last month",
      icon: CheckCircle,
      color: "text-purple-600"
    },
    {
      title: "Pending Reviews",
      value: "7",
      change: "2 overdue",
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your team's skill development progress
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Sarah Johnson updated React skills
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New skill assessment for Python
                  </p>
                  <p className="text-sm text-muted-foreground">
                    5 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Team meeting scheduled for skill review
                  </p>
                  <p className="text-sm text-muted-foreground">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
            <CardDescription>
              Most requested skills in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">React</Badge>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">TypeScript</Badge>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Python</Badge>
                <span className="text-sm text-muted-foreground">72%</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">AWS</Badge>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;