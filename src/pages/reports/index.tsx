import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, PieChart, TrendingUp, Download, Calendar, Users, Target, Activity } from "lucide-react";

const Reports = () => {
  const reportCategories = [
    {
      title: "Skills Analytics",
      description: "Comprehensive analysis of team skills and proficiency levels",
      icon: BarChart,
      reports: ["Skills Gap Analysis", "Proficiency Trends", "Training ROI", "Skill Distribution"],
      color: "bg-blue-100 text-blue-800"
    },
    {
      title: "Team Performance",
      description: "Team productivity and performance metrics",
      icon: TrendingUp,
      reports: ["Team Productivity", "Project Success Rate", "Individual Performance", "Goal Achievement"],
      color: "bg-green-100 text-green-800"
    },
    {
      title: "Project Insights",
      description: "Project-based reporting and analysis",
      icon: Target,
      reports: ["Project Timeline", "Resource Allocation", "Skill Utilization", "Budget Analysis"],
      color: "bg-purple-100 text-purple-800"
    },
    {
      title: "Compliance Reports",
      description: "Regulatory and compliance tracking",
      icon: Activity,
      reports: ["Training Compliance", "Certification Status", "Audit Trail", "Policy Adherence"],
      color: "bg-orange-100 text-orange-800"
    }
  ];

  const recentReports = [
    {
      name: "Q1 Skills Assessment Report",
      type: "Skills Analytics",
      generatedBy: "System",
      date: "2024-01-20",
      status: "Ready"
    },
    {
      name: "Team Performance Dashboard",
      type: "Team Performance", 
      generatedBy: "Manager",
      date: "2024-01-19",
      status: "Processing"
    },
    {
      name: "Project Milestone Report",
      type: "Project Insights",
      generatedBy: "Admin",
      date: "2024-01-18",
      status: "Ready"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate insights and track performance metrics
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <BarChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+23 this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <PieChart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2K</div>
            <p className="text-xs text-muted-foreground">Metrics tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Dashboards</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Real-time updates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Automated delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Report Categories</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800">
                    <category.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                  <Badge className={category.color}>
                    {category.reports.length} reports
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid gap-2">
                    {category.reports.map((report, reportIndex) => (
                      <div key={reportIndex} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{report}</span>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Generate
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline">
                    View All {category.title} Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Recently generated and scheduled reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{report.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{report.type}</span>
                    <span>•</span>
                    <span>By: {report.generatedBy}</span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'Ready' ? 'default' : 'outline'}>
                    {report.status}
                  </Badge>
                  {report.status === 'Ready' && (
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;