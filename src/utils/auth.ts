import { supabase } from '@/integrations/supabase/client';
import { USER_ROLES, type UserRole } from './constants';
import type { User } from '@supabase/supabase-js';

// Auth helper functions
export const authHelpers = {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get current user's profile with role
   */
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    // If no profile exists, create one
    if (!profile) {
      console.log('No profile found for user, creating one...');
      const newProfile = {
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || 'User',
        role: 'employee' as const
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }

      return createdProfile;
    }

    return profile;
  },

  /**
   * Check if user has specific role
   */
  async hasRole(requiredRole: UserRole): Promise<boolean> {
    const profile = await this.getCurrentUserProfile();
    return profile?.role === requiredRole;
  },

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const profile = await this.getCurrentUserProfile();
    return profile ? roles.includes(profile.role as UserRole) : false;
  },

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole(USER_ROLES.ADMIN);
  },

  /**
   * Check if user is manager or above
   */
  async isManagerOrAbove(): Promise<boolean> {
    return this.hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]);
  },

  /**
   * Check if user is tech lead or above
   */
  async isTechLeadOrAbove(): Promise<boolean> {
    return this.hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.TECH_LEAD]);
  },

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Check if user session is valid
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
};

// Role hierarchy utilities
export const roleHierarchy = {
  /**
   * Get role level (higher number = more permissions)
   */
  getRoleLevel(role: UserRole): number {
    const levels = {
      [USER_ROLES.EMPLOYEE]: 1,
      [USER_ROLES.TECH_LEAD]: 2,
      [USER_ROLES.MANAGER]: 3,
      [USER_ROLES.ADMIN]: 4
    };
    return levels[role] || 0;
  },

  /**
   * Check if role1 has higher or equal permissions than role2
   */
  hasPermissionLevel(role1: UserRole, role2: UserRole): boolean {
    return this.getRoleLevel(role1) >= this.getRoleLevel(role2);
  },

  /**
   * Get all roles with lower or equal permissions
   */
  getSubordinateRoles(role: UserRole): UserRole[] {
    const level = this.getRoleLevel(role);
    return Object.values(USER_ROLES).filter(r => this.getRoleLevel(r) <= level);
  }
};