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