import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface SkillMatch {
  skill_name: string;
  rating: string;
  approved_at: string;
}

interface UserResult {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  matched_skills: SkillMatch[];
  total_skills: number;
  matching_count: number;
  last_updated: string;
}

interface SubskillOption {
  id: string;
  name: string;
  skill_name: string;
  full_name: string;
}

export default function SkillExplorer() {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Access control - Allow all authenticated users
  const hasAccess = !!profile;
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [subskillOptions, setSubskillOptions] = useState<SubskillOption[]>([]);
  const [filteredSubskills, setFilteredSubskills] = useState<SubskillOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSubskills, setSelectedSubskills] = useState<SubskillOption[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load subskill options for live search
  useEffect(() => {
    const loadSubskills = async () => {
      try {
        const { data, error } = await supabase
          .from('subskills')
          .select(`
            id,
            name,
            skills!inner(name)
          `)
          .order('name');
        
        if (error) throw error;
        
        const options = data?.map(item => ({
          id: item.id,
          name: item.name,
          skill_name: item.skills.name,
          full_name: `${item.skills.name} > ${item.name}`
        })) || [];
        
        setSubskillOptions(options);
      } catch (error) {
        console.error('Error loading subskills:', error);
      }
    };
    
    if (hasAccess) {
      loadSubskills();
    }
  }, [hasAccess]);

  // Filter subskills based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubskills([]);
      setShowDropdown(false);
      return;
    }

    const filtered = subskillOptions
      .filter(option => 
        option.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.skill_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(option => !selectedSubskills.some(selected => selected.id === option.id))
      .slice(0, 10); // Limit to 10 results

    setFilteredSubskills(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, subskillOptions, selectedSubskills]);

  // Search function
  const handleSearch = async () => {
    if (selectedSubskills.length === 0) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Get all approved employee ratings for selected subskills
      let ratingsQuery = supabase
        .from('employee_ratings')
        .select(`
          user_id,
          skill_id,
          subskill_id,
          rating,
          approved_at,
          skills!inner(name),
          subskills!inner(name)
        `)
        .eq('status', 'approved')
        .in('subskill_id', selectedSubskills.map(s => s.id));

      // Apply level filter
      if (levelFilter !== 'all') {
        ratingsQuery = ratingsQuery.eq('rating', levelFilter);
      }

      const { data: ratingsData, error: ratingsError } = await ratingsQuery;
      
      if (ratingsError) throw ratingsError;

      if (!ratingsData || ratingsData.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs from ratings
      const userIds = [...new Set(ratingsData.map(r => r.user_id))];
      
      // Get user profiles, excluding admins and managers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, email')
        .in('user_id', userIds)
        .not('role', 'in', '(admin,manager)');
      
      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Create profile lookup map
      const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
      
      // Filter ratings to only include users we have profiles for
      const filteredRatings = ratingsData.filter(rating => profileMap.has(rating.user_id));

      // Group by user and format results
      const userMap = new Map<string, UserResult>();
      
      filteredRatings.forEach(rating => {
        const userId = rating.user_id;
        const profile = profileMap.get(userId);
        
        if (!profile) return;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            full_name: profile.full_name,
            role: profile.role,
            email: profile.email,
            matched_skills: [],
            total_skills: selectedSubskills.length,
            matching_count: 0,
            last_updated: rating.approved_at
          });
        }
        
        const user = userMap.get(userId)!;
        
        // Add skill match
        user.matched_skills.push({
          skill_name: `${rating.skills.name} > ${rating.subskills.name}`,
          rating: rating.rating,
          approved_at: rating.approved_at
        });
        
        // Update last updated date
        if (rating.approved_at > user.last_updated) {
          user.last_updated = rating.approved_at;
        }
      });

      // Calculate matching count and sort results
      const results = Array.from(userMap.values()).map(user => ({
        ...user,
        matching_count: user.matched_skills.length
      }));

      // Sort by matching count (highest first), then by name
      results.sort((a, b) => {
        const countDiff = b.matching_count - a.matching_count;
        return countDiff !== 0 ? countDiff : a.full_name.localeCompare(b.full_name);
      });

      setResults(results);
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search skills. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add subskill selection
  const handleSubskillSelect = (subskill: SubskillOption) => {
    if (!selectedSubskills.some(s => s.id === subskill.id)) {
      setSelectedSubskills(prev => [...prev, subskill]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Remove subskill selection
  const removeSubskill = (subskillId: string) => {
    setSelectedSubskills(prev => prev.filter(s => s.id !== subskillId));
  };

  // Toggle row expansion
  const toggleRowExpansion = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Export results
  const handleExport = () => {
    if (results.length === 0) {
      toast({
        title: "No Data",
        description: "No search results to export.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare CSV data
    const csvData = results.flatMap(user => 
      user.matched_skills.map(skill => ({
        'User Name': user.full_name,
        'Role': user.role,
        'Email': user.email,
        'Matching Skills Count': `${user.matching_count}/${user.total_skills}`,
        'Matched Subskill': skill.skill_name,
        'Skill Level': skill.rating.toUpperCase(),
        'Approved Date': new Date(skill.approved_at).toLocaleDateString(),
        'Last Updated': new Date(user.last_updated).toLocaleDateString()
      }))
    );
    
    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => 
        `"${(row as any)[header]?.toString().replace(/"/g, '""') || ''}"`)
        .join(',')
      )
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-explorer-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${results.length} user records with ${csvData.length} skill entries.`
    });
  };

  // Get rating badge variant
  const getRatingVariant = (rating: string) => {
    switch (rating) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Trigger search when selections change
  useEffect(() => {
    if (selectedSubskills.length > 0) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [selectedSubskills, levelFilter]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Explorer</h1>
          <p className="text-muted-foreground mt-1">
            Search and explore approved skills across your team
          </p>
        </div>
        
        <Button 
          onClick={handleExport}
          disabled={results.length === 0}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Results
        </Button>
      </div>

      {/* Search Controls */}
      <div className="max-w-2xl mx-auto mb-8 space-y-4">
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subskills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            
            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 bg-popover border rounded-md shadow-lg z-10 mt-1">
                {filteredSubskills.map(subskill => (
                  <div
                    key={subskill.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => handleSubskillSelect(subskill)}
                  >
                    <div className="font-medium">{subskill.full_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Subskills */}
        {selectedSubskills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSubskills.map(subskill => (
              <Badge 
                key={subskill.id} 
                variant="secondary" 
                className="gap-2 pr-1"
              >
                {subskill.full_name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeSubskill(subskill.id)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Results Found</h3>
          <p className="text-sm text-muted-foreground">
            {selectedSubskills.length === 0 
              ? "Search for subskills to find team members with matching expertise."
              : "No team members found with the selected subskills and level criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {results.length} team member{results.length !== 1 ? 's' : ''} 
              {' '}with matching skills
            </p>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Matching Skills</TableHead>
                  <TableHead>Approved Skills</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(user => (
                  <>
                    <TableRow key={user.user_id} className="cursor-pointer">
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                          onClick={() => toggleRowExpansion(user.user_id)}
                        >
                          {expandedRows.has(user.user_id) ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-1" />
                          )}
                          {user.matching_count}/{user.total_skills} matched
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.matched_skills.slice(0, 3).map((skill, idx) => (
                            <Badge 
                              key={idx} 
                              variant={getRatingVariant(skill.rating)}
                              className="text-xs"
                            >
                              {skill.rating.toUpperCase()}
                            </Badge>
                          ))}
                          {user.matched_skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.matched_skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.last_updated).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row */}
                    {expandedRows.has(user.user_id) && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/50 p-6">
                          <div className="space-y-3">
                            <h4 className="font-medium">Matched Subskills:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {user.matched_skills.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-background rounded border">
                                  <span className="text-sm font-medium">{skill.skill_name}</span>
                                  <Badge variant={getRatingVariant(skill.rating)}>
                                    {skill.rating.toUpperCase()}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}