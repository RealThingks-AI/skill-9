import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useCategoryPreferences = () => {
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchPreferences = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_category_preferences')
        .select('visible_category_ids')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      // If no preferences exist, start with empty array (show no categories by default)
      setVisibleCategoryIds(data?.visible_category_ids || []);
    } catch (error) {
      console.error('Error fetching category preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load category preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (categoryIds: string[]) => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('user_category_preferences')
        .upsert({
          user_id: profile.user_id,
          visible_category_ids: categoryIds
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setVisibleCategoryIds(categoryIds);
    } catch (error) {
      console.error('Error updating category preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update category preferences",
        variant: "destructive",
      });
    }
  };

  const addCategories = async (categoryIds: string[]) => {
    const newCategoryIds = [...new Set([...visibleCategoryIds, ...categoryIds])];
    const addedCount = newCategoryIds.length - visibleCategoryIds.length;
    
    await updatePreferences(newCategoryIds);
    
    if (addedCount > 0) {
      toast({
        title: "Categories Added",
        description: `${addedCount} categor${addedCount === 1 ? 'y' : 'ies'} added to your dashboard`,
      });
    }
  };

  const hideCategory = async (categoryId: string, categoryName: string) => {
    const newCategoryIds = visibleCategoryIds.filter(id => id !== categoryId);
    await updatePreferences(newCategoryIds);
    toast({
      title: "Category Hidden",
      description: `"${categoryName}" has been hidden from your dashboard`,
    });
  };

  useEffect(() => {
    fetchPreferences();
  }, [profile]);

  return {
    visibleCategoryIds,
    loading,
    addCategories,
    hideCategory,
    refetch: fetchPreferences
  };
};