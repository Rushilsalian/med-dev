import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface KarmaActivity {
  id: string;
  user_id: string;
  activity_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export type KarmaActivityType = 
  | 'GIVE_UPVOTE' 
  | 'RECEIVE_UPVOTE' 
  | 'CREATE_POST' 
  | 'CREATE_COMMENT'
  | 'JOIN_COMMUNITY'
  | 'CREATE_COMMUNITY';

const KARMA_POINTS: Record<KarmaActivityType, number> = {
  GIVE_UPVOTE: 1,
  RECEIVE_UPVOTE: 5,
  CREATE_POST: 10,
  CREATE_COMMENT: 2,
  JOIN_COMMUNITY: 1,
  CREATE_COMMUNITY: 15
};

export const useKarmaSystem = () => {
  const [totalKarma, setTotalKarma] = useState(0);
  const [activities, setActivities] = useState<KarmaActivity[]>([]);
  const [userRank, setUserRank] = useState('Rookie');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchKarmaData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('karma_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
      
      const total = data?.reduce((sum, activity) => sum + activity.points, 0) || 0;
      setTotalKarma(total);

      // Get user rank from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('rank')
        .eq('id', user.id)
        .single();
      
      setUserRank(profile?.rank || 'Rookie');
    } catch (error) {
      console.error('Error fetching karma data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addKarmaActivity = async (activityType: KarmaActivityType, description?: string) => {
    if (!user) return;

    try {
      const points = KARMA_POINTS[activityType];
      
      const { error } = await supabase
        .from('karma_activities')
        .insert([{
          user_id: user.id,
          activity_type: activityType,
          points: points,
          description: description || null
        }]);

      if (error) throw error;

      // Update local state
      setTotalKarma(prev => prev + points);
      
      // Optionally show notification for significant karma gains
      if (points >= 5) {
        toast({ 
          title: `+${points} Karma!`, 
          description: description || `Earned for ${activityType.toLowerCase().replace('_', ' ')}`
        });
      }

      await fetchKarmaData(); // Refresh to get latest data
    } catch (error) {
      console.error('Error adding karma activity:', error);
    }
  };

  // Helper function for common karma activities
  const updateKarma = (activityType: KarmaActivityType, description?: string) => {
    addKarmaActivity(activityType, description);
  };

  useEffect(() => {
    if (user) {
      fetchKarmaData();
    }
  }, [user]);

  return {
    totalKarma,
    activities,
    userRank,
    loading,
    updateKarma,
    addKarmaActivity,
    refetch: fetchKarmaData
  };
};