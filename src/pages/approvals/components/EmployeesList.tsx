import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";
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
}

export const EmployeesList = ({ onEmployeeClick }: EmployeesListProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, role, department')
          .in('role', ['employee', 'tech_lead', 'management'])
          .eq('status', 'active')
          .order('full_name');

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tech_lead':
        return 'bg-blue-100 text-blue-800';
      case 'management':
        return 'bg-purple-100 text-purple-800';
      case 'employee':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employees & Tech Leads
        </CardTitle>
        <CardDescription>
          View complete rating history and details for each team member
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No employees found.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {employees.map((employee) => (
              <div 
                key={employee.user_id} 
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onEmployeeClick(employee)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{employee.full_name}</p>
                      <p className="text-xs text-muted-foreground">{employee.email}</p>
                      {employee.department && (
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getRoleColor(employee.role)}>
                      {formatRole(employee.role)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">View history</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};