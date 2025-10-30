import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Search } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getRatingColor, formatRole } from "../utils/skillExplorerHelpers";

interface UserResult {
  user_id: string;
  full_name: string;
  role: string;
  matching_count: number;
  approved_skills: {
    skill: string;
    subskill: string;
    rating: string;
  }[];
}

interface Selection {
  id: string;
  subskill: string;
}

interface SkillExplorerTableProps {
  loading: boolean;
  results: UserResult[];
  selections: Selection[];
  sortField: string;
  onSort: (field: string) => void;
  selectedEngineers: string[];
  onToggleEngineer: (userId: string) => void;
  onToggleAll: () => void;
}

export function SkillExplorerTable({
  loading,
  results,
  selections,
  sortField,
  onSort,
  selectedEngineers,
  onToggleEngineer,
  onToggleAll,
}: SkillExplorerTableProps) {
  const allSelected = results.length > 0 && selectedEngineers.length === results.length;
  const someSelected = selectedEngineers.length > 0 && selectedEngineers.length < results.length;

  // Show empty state without table structure when no selections
  if (selections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Search className="h-10 w-10 opacity-20" />
          <p className="text-base font-medium">Select subskills above to see matching engineers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-0">
            <TableHead className="w-12 sticky left-0 bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] border-r border-border/20">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label="Select all engineers"
                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-base min-w-[200px] sticky left-12 bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-muted/80 border-r border-border/20"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-2 py-1">
                Engineer Name
                <ArrowUpDown
                  className={`h-4 w-4 transition-opacity ${sortField === "name" ? "opacity-100" : "opacity-50"}`}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-semibold text-base min-w-[140px] sticky left-[calc(48px+200px)] bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-muted/80 border-r border-border/20"
              onClick={() => onSort("role")}
            >
              <div className="flex items-center gap-2 py-1">
                Role
                <ArrowUpDown
                  className={`h-4 w-4 transition-opacity ${sortField === "role" ? "opacity-100" : "opacity-50"}`}
                />
              </div>
            </TableHead>
            {selections.map((selection) => (
              <TableHead
                key={selection.id}
                className="font-semibold text-sm min-w-[120px] text-center cursor-pointer bg-muted hover:bg-muted/80 transition-all duration-200 border-r border-border/20"
                onClick={() => onSort(selection.subskill)}
              >
                <div className="flex flex-col items-center gap-1 py-1">
                  <div className="flex items-center gap-1.5">
                    <span>{selection.subskill}</span>
                    <ArrowUpDown
                      className={`h-3.5 w-3.5 transition-opacity ${
                        sortField === selection.subskill ? "opacity-100" : "opacity-100"
                      }`}
                    />
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3 + selections.length} className="text-center py-16">
                <LoadingSpinner />
              </TableCell>
            </TableRow>
          ) : results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3 + selections.length} className="text-center py-16">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Search className="h-10 w-10 opacity-20" />
                  <p className="text-base font-medium">No engineers found matching the selected criteria</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            results.map((user) => (
              <TableRow
                key={user.user_id}
                className="hover:bg-muted/30 transition-all duration-200 animate-fade-in border-b hover:border-primary/20"
              >
                <TableCell className="sticky left-0 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] py-4 border-r border-border/20">
                  <Checkbox
                    checked={selectedEngineers.includes(user.user_id)}
                    onCheckedChange={() => onToggleEngineer(user.user_id)}
                    aria-label={`Select ${user.full_name}`}
                  />
                </TableCell>
                <TableCell className="font-medium text-base sticky left-12 bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] py-4 border-r border-border/20">
                  {user.full_name}
                </TableCell>
                <TableCell className="sticky left-[calc(48px+200px)] bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] py-4 border-r border-border/20">
                  <span className="text-base">{formatRole(user.role)}</span>
                </TableCell>
                {selections.map((selection) => {
                  const userSkill = user.approved_skills.find((s) => s.subskill === selection.subskill);
                  return (
                    <TableCell key={selection.id} className="text-center py-4 border-r border-border/20">
                      {userSkill ? (
                        <Badge
                          className={`${getRatingColor(userSkill.rating)} text-white text-sm font-semibold px-3 py-1 transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                        >
                          {userSkill.rating === "high" ? "H" : userSkill.rating === "medium" ? "M" : "L"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
