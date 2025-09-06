import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useKarma } from "@/hooks/useKarma";
import { 
  Heart, 
  Brain, 
  Eye, 
  Bone, 
  Users, 
  MessageCircle, 
  ArrowUp, 
  Clock,
  Sparkles 
} from "lucide-react";

const communities = [
  {
    name: "Cardiology",
    icon: Heart,
    members: "2.3k",
    posts: "156",
    description: "Heart conditions, procedures, and research",
    color: "text-red-500"
  },
  {
    name: "Neurology", 
    icon: Brain,
    members: "1.8k",
    posts: "124",
    description: "Brain disorders and neurological conditions",
    color: "text-purple-500"
  },
  {
    name: "Radiology",
    icon: Eye,
    members: "1.5k", 
    posts: "98",
    description: "Medical imaging and diagnostic radiology",
    color: "text-blue-500"
  },
  {
    name: "Orthopedics",
    icon: Bone,
    members: "1.2k",
    posts: "87",
    description: "Musculoskeletal system and joint disorders",
    color: "text-orange-500"
  }
];

const samplePosts = [
  {
    title: "Complex mitral valve repair in elderly patient - seeking second opinions",
    author: "Dr. Sarah Chen",
    specialty: "Cardiothoracic Surgery",
    timeAgo: "2 hours ago",
    upvotes: 24,
    comments: 8,
    tags: ["Cardiology", "Surgery", "Geriatrics"],
    aiSummary: true
  },
  {
    title: "Novel treatment approach for treatment-resistant epilepsy - Case series",
    author: "Dr. Michael Torres",
    specialty: "Neurology",
    timeAgo: "4 hours ago", 
    upvotes: 31,
    comments: 12,
    tags: ["Neurology", "Research", "Clinical Trial"],
    aiSummary: false
  },
  {
    title: "Unusual imaging findings in pediatric brain tumor - collaborative diagnosis",
    author: "Dr. Emily Watson",
    specialty: "Pediatric Radiology",
    timeAgo: "6 hours ago",
    upvotes: 18,
    comments: 15,
    tags: ["Radiology", "Pediatrics", "Oncology"],
    aiSummary: true
  }
];

const CommunityPreview = () => {
  const navigate = useNavigate();
  const { updateKarma } = useKarma();
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(JSON.parse(localStorage.getItem('joinedCommunities') || '[]'));

  const handleJoinCommunity = (communityName: string) => {
    if (joinedCommunities.includes(communityName)) {
      navigate('/communities');
      return;
    }
    
    const newJoined = [...joinedCommunities, communityName];
    setJoinedCommunities(newJoined);
    localStorage.setItem('joinedCommunities', JSON.stringify(newJoined));
    
    updateKarma('GIVE_UPVOTE');
    toast({ title: "Joined community!", description: "+1 Karma for joining" });
  };
  
  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Specialty Hangout Rooms
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your tribe! Connect with docs in your specialty, share interesting cases, and learn from each other.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {communities.map((community) => {
            const IconComponent = community.icon;
            return (
              <Card key={community.name} className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10`}>
                    <IconComponent className={`h-6 w-6 ${community.color}`} />
                  </div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {community.posts}
                    </span>
                  </div>
                  <Button 
                    variant={joinedCommunities.includes(community.name) ? "default" : "outline"} 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleJoinCommunity(community.name)}
                  >
                    {joinedCommunities.includes(community.name) ? 'View Hangout' : 'Join Hangout'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">What's Happening in the Hangout</h3>
          <div className="space-y-4 sm:space-y-6">
            {samplePosts.map((post, index) => (
              <Card key={index} className="hover:shadow-medium transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm font-medium">{post.upvotes}</span>
                    </div>
                    
                    <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <h4 className="text-base sm:text-lg font-semibold leading-tight hover:text-primary cursor-pointer" onClick={() => navigate('/collaborate')}>
                          {post.title}
                        </h4>
                        {post.aiSummary && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Sparkles className="h-3 w-3" />
                            <span className="text-xs">AI Summary</span>
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                            <AvatarFallback className="text-xs">
                              {post.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span>{post.specialty}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.timeAgo}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex gap-1 flex-wrap">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;