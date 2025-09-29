import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, User, Eye, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
interface Employee {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
}
interface EmployeesListProps {
  onEmployeeClick: (employee: Employee) => void;
  roleFilter: string;
  searchTerm: string;
}
export const EmployeesList = ({
  onEmployeeClick,
  roleFilter,
  searchTerm
}: EmployeesListProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('profiles').select('user_id, full_name, email, role, department').in('role', ['employee', 'tech_lead', 'management']).eq('status', 'active').order('full_name');
        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Filter employees based on role and search term
  const filteredEmployees = employees.filter(employee => {
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tech_lead':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'management':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'employee':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const formatRole = (role: string) => {
    switch (role) {
      case 'tech_lead':
        return 'Tech Lead';
      case 'management':
        return 'Management';
      case 'employee':
        return 'Employee';
      default:
        return role;
    }
  };
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </CardTitle>
          <CardDescription className="text-sm">
            {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''}
            {roleFilter !== 'all' ? ` • ${formatRole(roleFilter)}` : ''}
            {searchTerm ? ` • "${searchTerm}"` : ''}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No employees found.</div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.user_id}
                  className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {(emp.full_name || emp.email || '?')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{emp.full_name}</div>
                      <div className="text-sm text-muted-foreground">{emp.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(emp.role)}>
                      {formatRole(emp.role)}
                    </Badge>
                    {emp.department && (
                      <Badge variant="outline">{emp.department}</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onEmployeeClick(emp)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};