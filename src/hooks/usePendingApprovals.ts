import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePendingApprovals = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchPendingCount = async () => {
    if (!profile || !['tech_lead', 'manager', 'admin'].includes(profile.role)) {
      setPendingCount(0);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching pending approval count...');
      
      const { data, error } = await supabase
        .from('employee_ratings')
        .select('id')
        .eq('status', 'submitted');

      if (error) {
        console.error('Error fetching pending approvals:', error);
        setPendingCount(0);
      } else {
        console.log('📊 Found pending ratings:', data?.length || 0);
        setPendingCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error in fetchPendingCount:', error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [profile]);

  // Set up real-time subscription for employee_ratings changes
  useEffect(() => {
    if (!profile || !['tech_lead', 'manager', 'admin'].includes(profile.role)) {
      return;
    }

    const channel = supabase
      .channel('pending-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_ratings'
        },
        () => {
          // Refetch count when ratings change
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return {
    pendingCount,
    loading,
    refetch: fetchPendingCount
  };
};