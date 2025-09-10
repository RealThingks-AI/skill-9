import type { UserSkill } from "@/types/database";

export const getCurrentSkillRating = (
  skillId: string,
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>,
  userSkills: UserSkill[]
) => {
  const pending = pendingRatings.get(skillId);
  if (pending && pending.type === 'skill') return pending.rating;
  return userSkills.find(us => us.skill_id === skillId && !us.subskill_id)?.rating as 'high' | 'medium' | 'low' | null;
};

export const getCurrentSubskillRating = (
  subskillId: string,
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>,
  userSkills: UserSkill[]
) => {
  const pending = pendingRatings.get(subskillId);
  if (pending && pending.type === 'subskill') return pending.rating;
  return userSkills.find(us => us.subskill_id === subskillId)?.rating as 'high' | 'medium' | 'low' | null;
};

export const getStatusColor = (status?: string) => {
  switch (status) {
    case 'draft':
      return 'bg-amber-100 text-amber-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const getRatingValue = (rating: 'high' | 'medium' | 'low'): number => {
  switch (rating) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

export const calculateCategoryProgress = (
  categoryId: string,
  skills: any[],
  subskills: any[],
  userSkills: any[]
) => {
  // Get skills for this category
  const categorySkills = skills.filter(skill => skill.category_id === categoryId);
  
  let totalItems = 0;
  let ratedItems = 0;
  let ratingCounts = { high: 0, medium: 0, low: 0 };
  let approvedCount = 0;
  let pendingCount = 0;
  
  categorySkills.forEach(skill => {
    // Get subskills for this skill
    const skillSubskills = subskills.filter(subskill => subskill.skill_id === skill.id);
    
    if (skillSubskills.length > 0) {
      // Skill has subskills - count subskills
      totalItems += skillSubskills.length;
      
      skillSubskills.forEach(subskill => {
        const rating = userSkills.find(r => r.subskill_id === subskill.id && r.status === 'approved');
        if (rating) {
          ratedItems++;
          ratingCounts[rating.rating as 'high' | 'medium' | 'low']++;
          approvedCount++;
        } else {
          // Check for pending ratings
          const pendingRating = userSkills.find(r => r.subskill_id === subskill.id && r.status === 'submitted');
          if (pendingRating) {
            pendingCount++;
          }
        }
      });
    } else {
      // Skill has no subskills - count the skill itself
      totalItems++;
      
      const rating = userSkills.find(r => r.skill_id === skill.id && !r.subskill_id && r.status === 'approved');
      if (rating) {
        ratedItems++;
        ratingCounts[rating.rating as 'high' | 'medium' | 'low']++;
        approvedCount++;
      } else {
        // Check for pending ratings
        const pendingRating = userSkills.find(r => r.skill_id === skill.id && !r.subskill_id && r.status === 'submitted');
        if (pendingRating) {
          pendingCount++;
        }
      }
    }
  });
  
  const progressPercentage = totalItems > 0 ? Math.round((ratedItems / totalItems) * 100) : 0;
  
  return {
    totalItems,
    ratedItems,
    progressPercentage,
    ratingCounts,
    approvedCount,
    pendingCount
  };
};