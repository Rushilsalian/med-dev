import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface PostTag {
  id: string;
  tag: string;
}

export interface PostAuthor {
  id: string;
  display_name: string | null;
  specialization: string | null;
  is_verified: boolean | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string | null;
  category: 'exam' | 'second_opinion' | 'non_medical' | 'general';
  created_at: string;
  updated_at: string;
  is_ai_summary: boolean;
  upvotes: number;
  downvotes: number;
  status: string;
  author: PostAuthor;
  community?: {
    id: string;
    name: string;
  };
  post_tags: PostTag[];
  comments: { count: number }[];
  user_vote?: {
    vote_type: string;
  } | null;
}

const POSTS_PER_PAGE = 10;

export const usePosts = (communityId?: string) => {
  const { user } = useAuth();
  
  const fetchPosts = async ({ pageParam = 0 }) => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, display_name, specialization, is_verified),
        community:communities(id, name),
        post_tags(id, tag),
        comments(count)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch user votes if logged in
    let userVotes: any[] = [];
    if (user && data) {
      const postIds = data.map(post => post.id);
      const { data: votesData } = await supabase
        .from('post_votes')
        .select('post_id, vote_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      userVotes = votesData || [];
    }

    const processedPosts = data?.map(post => ({
      ...post,
      user_vote: userVotes.find(vote => vote.post_id === post.id) || null
    })) || [];

    return {
      posts: processedPosts,
      nextPage: data && data.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['posts', communityId, user?.id],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];



  const createPost = async (postData: {
    title: string;
    content: string;
    community_id?: string;
    category?: 'exam' | 'second_opinion' | 'non_medical' | 'general';
    tags?: string[];
  }) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to create posts",
        variant: "destructive" 
      });
      return false;
    }

    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([{
          title: postData.title,
          content: postData.content,
          author_id: user.id,
          community_id: postData.community_id || null,
          category: postData.category || 'general'
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Add tags if provided
      if (postData.tags && postData.tags.length > 0) {
        const tagInserts = postData.tags.map(tag => ({
          post_id: post.id,
          tag: tag.trim()
        }));

        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast({ 
        title: "Post created!", 
        description: "Your post has been published" 
      });
      
      await refetch(); // Refresh posts
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create post",
        variant: "destructive" 
      });
      return false;
    }
  };

  const voteOnPost = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to vote",
        variant: "destructive" 
      });
      return false;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          const { error } = await supabase
            .from('post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Update vote if different type
          const { error } = await supabase
            .from('post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('post_votes')
          .insert([{
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          }]);

        if (error) throw error;
      }

      await refetch(); // Refresh to get updated vote counts
      return true;
    } catch (error) {
      console.error('Error voting on post:', error);
      toast({ 
        title: "Error", 
        description: "Failed to vote on post",
        variant: "destructive" 
      });
      return false;
    }
  };



  return {
    posts,
    loading: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createPost,
    voteOnPost,
    refetch
  };
};