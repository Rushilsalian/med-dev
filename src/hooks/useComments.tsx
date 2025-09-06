import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    specialization: string | null;
  };
  replies?: Comment[];
}

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_author_id_fkey(id, display_name, specialization)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threaded structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create all comment objects
      data?.forEach(comment => {
        const commentObj: Comment = {
          ...comment,
          replies: []
        };
        commentsMap.set(comment.id, commentObj);
      });

      // Second pass: organize into threaded structure
      data?.forEach(comment => {
        const commentObj = commentsMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch comments",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (content: string, parentCommentId?: string) => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please sign in to comment",
        variant: "destructive" 
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          author_id: user.id,
          content: content,
          parent_comment_id: parentCommentId || null
        }]);

      if (error) throw error;

      toast({ 
        title: "Comment added!", 
        description: "Your comment has been posted" 
      });
      
      await fetchComments(); // Refresh comments
      return true;
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({ 
        title: "Error", 
        description: "Failed to post comment",
        variant: "destructive" 
      });
      return false;
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) throw error;

      toast({ 
        title: "Comment updated!", 
        description: "Your comment has been updated" 
      });
      
      await fetchComments(); // Refresh comments
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update comment",
        variant: "destructive" 
      });
      return false;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, user]);

  return {
    comments,
    loading,
    createComment,
    updateComment,
    refetch: fetchComments
  };
};