import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, MessageCircle, ThumbsUp, Star } from "lucide-react";
import { useKarmaSystem } from "@/hooks/useKarmaSystem";
import { useAuth } from "@/hooks/useAuth";

const KarmaDisplay = () => {
  const { totalKarma, userRank, activities, loading } = useKarmaSystem();
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Karma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Sign in to view your karma
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Karma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'General': return 'text-yellow-600 bg-yellow-100';
      case 'Colonel': return 'text-purple-600 bg-purple-100';
      case 'Major': return 'text-red-600 bg-red-100';
      case 'Captain': return 'text-blue-600 bg-blue-100';
      case 'Lieutenant': return 'text-green-600 bg-green-100';
      case 'Sergeant': return 'text-orange-600 bg-orange-100';
      case 'Corporal': return 'text-gray-600 bg-gray-100';
      case 'Private': return 'text-slate-600 bg-slate-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level: string) => {
    return 'text-primary';
  };

  // Calculate karma breakdown
  const postKarma = activities.filter(a => a.activity_type === 'CREATE_POST').reduce((sum, a) => sum + a.points, 0);
  const commentKarma = activities.filter(a => a.activity_type === 'CREATE_COMMENT').reduce((sum, a) => sum + a.points, 0);
  const voteKarma = activities.filter(a => a.activity_type.includes('VOTE')).reduce((sum, a) => sum + a.points, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Karma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{totalKarma}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className={`${getRankColor(userRank)} font-medium flex items-center gap-1`}>
              <Star className="h-3 w-3" />
              {userRank}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Posts
            </span>
            <span className="font-medium">{postKarma}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Comments
            </span>
            <span className="font-medium">{commentKarma}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              Votes
            </span>
            <span className="font-medium">{voteKarma}</span>
          </div>
        </div>
        
        {activities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
            <div className="space-y-1 text-xs">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {activity.description || activity.activity_type.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-green-600">+{activity.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KarmaDisplay;