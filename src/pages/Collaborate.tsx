import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { useCommunities } from "@/hooks/useCommunities";
import { useKarmaSystem } from "@/hooks/useKarmaSystem";
import { useModerationSystem } from "@/hooks/useModerationSystem";
import KarmaDisplay from "@/components/KarmaDisplay";
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  Share2, 
  Plus,
  Search,
  TrendingUp,
  Clock,
  Sparkles,
  Filter,
  X,
  Image as ImageIcon,
  Copy
} from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import * as htmlToImage from 'html-to-image';

const Collaborate = () => {
  const navigate = useNavigate();
  const { 
    posts, 
    loading: postsLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    createPost, 
    voteOnPost 
  } = usePosts();
  const { communities, loading: communitiesLoading } = useCommunities();
  const { updateKarma } = useKarmaSystem();
  const { moderateContent } = useModerationSystem();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community_id: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const shareCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({ title: "Please fill in title and content", variant: "destructive" });
      return;
    }

    if (!moderateContent(newPost.title) || !moderateContent(newPost.content)) {
      return;
    }

    const success = await createPost({
      title: newPost.title,
      content: newPost.content,
      community_id: newPost.community_id || undefined,
      tags: newPost.tags
    });

    if (success) {
      setNewPost({ title: '', content: '', community_id: '', tags: [] });
      setShowCreatePost(false);
      updateKarma('CREATE_POST', 'Created a new post');
    }
  };

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    const success = await voteOnPost(postId, voteType);
    if (success && voteType === 'upvote') {
      updateKarma('GIVE_UPVOTE', 'Gave an upvote');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !newPost.tags.includes(newTag.trim())) {
      setNewPost(prev => ({ 
        ...prev, 
        tags: [...prev.tags, newTag.trim()] 
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewPost(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const generateShareableImage = async (post: any) => {
    const shareCardRef = shareCardRefs.current[post.id];
    if (!shareCardRef) return;

    setGeneratingImage(post.id);
    
    try {
      const dataUrl = await htmlToImage.toPng(shareCardRef, {
        backgroundColor: '#ffffff',
        width: 600,
        height: 400,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `doc-hangout-${post.title.slice(0, 30)}.png`;
      link.href = dataUrl;
      link.click();
      
      // Copy shareable link
      const shareableLink = `${window.location.origin}/collaborate?post=${post.id}`;
      await navigator.clipboard.writeText(shareableLink);
      
      toast({ 
        title: "Image generated and link copied!", 
        description: "Share the link to let others view this post" 
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ 
        title: "Error generating image", 
        variant: "destructive" 
      });
    } finally {
      setGeneratingImage(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const filteredAndSortedPosts = posts
    .filter(post => {
      if (!searchTerm) return true;
      return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.post_tags.some(tag => tag.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .filter(post => {
      if (filterBy === 'all') return true;
      return post.community?.name?.toLowerCase() === filterBy.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'popular') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 0;
    });

  if (postsLoading || communitiesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-4 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Discussion</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input 
                        placeholder="Title of your case or question..."
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Textarea 
                        placeholder="Describe your case, question, or share your insights..."
                        rows={6}
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      />
                      <Select value={newPost.community_id} onValueChange={(value) => setNewPost(prev => ({ ...prev, community_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a community (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No specific community</SelectItem>
                          {communities.map((community) => (
                            <SelectItem key={community.id} value={community.id}>
                              {community.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add a tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <Button onClick={addTag} variant="outline" size="sm">Add</Button>
                        </div>
                        {newPost.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {newPost.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                {tag} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleCreatePost}>Post</Button>
                        <Button variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <KarmaDisplay />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>COVID-19 Updates</span>
                  <Badge variant="secondary">Hot</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>AI in Diagnostics</span>
                  <Badge variant="secondary">Rising</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Telemedicine</span>
                  <Badge variant="secondary">Popular</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {/* Sort Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold">Doc Hangout Discussions</h1>
              <div className="flex gap-2 overflow-x-auto">
                <Button 
                  variant={sortBy === "recent" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSortBy("recent")}
                  className="whitespace-nowrap"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Recent
                </Button>
                <Button 
                  variant={sortBy === "popular" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSortBy("popular")}
                  className="whitespace-nowrap"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Popular
                </Button>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Communities</SelectItem>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.name}>
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {filteredAndSortedPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No posts found. Be the first to start a discussion!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedPosts.map((post) => (
                  <div key={post.id}>
                    {/* Hidden share card for image generation */}
                    <div 
                      ref={(el) => shareCardRefs.current[post.id] = el}
                      className="fixed -top-[9999px] left-0 w-[600px] h-[400px] bg-white p-8 border-2 border-gray-200"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">DH</span>
                            </div>
                            <div>
                              <h1 className="text-xl font-bold text-gray-900">Doc Hangout</h1>
                              <p className="text-sm text-gray-600">Medical Professional Community</p>
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{post.title}</h2>
                          <p className="text-gray-700 text-base leading-relaxed mb-4">
                            {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {post.author.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{post.author.display_name || 'Anonymous'}</p>
                              <p className="text-sm text-gray-600">{post.community?.name || 'General Discussion'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600">
                              <span className="text-lg font-bold">↑{post.upvotes - post.downvotes}</span>
                            </div>
                            <p className="text-xs text-gray-500">karma points</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visible post card */}
                    <Card className="hover:shadow-medium transition-all duration-300">
                      <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-2 sm:gap-4">
                        {/* Voting */}
                        <div className="flex flex-col items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 ${
                              post.user_vote?.vote_type === 'upvote' ? 'bg-green-50 text-green-600' : ''
                            }`}
                            onClick={() => handleVote(post.id, 'upvote')}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">{post.upvotes - post.downvotes}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 ${
                              post.user_vote?.vote_type === 'downvote' ? 'bg-red-50 text-red-600' : ''
                            }`}
                            onClick={() => handleVote(post.id, 'downvote')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold leading-tight hover:text-primary cursor-pointer">
                              {post.title}
                            </h3>
                            {post.is_ai_summary && (
                              <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Summary
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {post.content}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {post.author.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{post.author.display_name || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span>{post.author.specialization || 'Medical Professional'}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(post.created_at)}</span>
                              {post.community && (
                                <>
                                  <span>•</span>
                                  <span>{post.community.name}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex gap-1 flex-wrap">
                              {post.post_tags.map((tagObj) => (
                                <Badge key={tagObj.id} variant="outline" className="text-xs">
                                  {tagObj.tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-foreground p-1 sm:p-2"
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">{post.comments?.[0]?.count || 0}</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-foreground p-1 sm:p-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${post.title} - ${window.location.origin}/collaborate`);
                                  toast({ title: "Link copied to clipboard!" });
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Share</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-foreground p-1 sm:p-2"
                                onClick={() => generateShareableImage(post)}
                                disabled={generatingImage === post.id}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">
                                  {generatingImage === post.id ? 'Generating...' : 'Image'}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
              
              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isFetchingNextPage && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading more posts...</p>
                    </CardContent>
                  </Card>
                )}
                {!hasNextPage && posts.length > 0 && (
                  <Card>
                    <CardContent className="text-center py-4">
                      <p className="text-muted-foreground text-sm">You've reached the end!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaborate;