import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string | null;
  group_conversation_id: string | null;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_moderated: boolean;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    specialization: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

export interface GroupConversation {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  members: {
    id: string;
    display_name: string | null;
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles!conversations_participant_1_fkey(id, display_name, specialization),
          profiles!conversations_participant_2_fkey(id, display_name, specialization)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get messages for conversations separately
      const conversationIds = conversationsData?.map(c => c.id) || [];
      let messagesData = [];
      if (conversationIds.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        
        if (!msgsError) messagesData = msgs || [];
      }

      const processedConversations = conversationsData?.map(conv => {
        const otherParticipant = conv.participant_1 === user.id 
          ? conv.profiles[1] 
          : conv.profiles[0];
        
        const convMessages = messagesData.filter(msg => msg.conversation_id === conv.id);
        const lastMessage = convMessages.length > 0 ? convMessages[0] : null;
        const unreadCount = convMessages.filter(msg => 
          msg.sender_id !== user.id && !msg.read_at
        ).length;

        return {
          ...conv,
          other_participant: otherParticipant,
          last_message: lastMessage,
          unread_count: unreadCount
        };
      }) || [];

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch conversations",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupConversations = async () => {
    if (!user) return;

    try {
      // Get groups where user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!membershipData || membershipData.length === 0) {
        setGroupConversations([]);
        return;
      }

      const groupIds = membershipData.map(m => m.group_id);

      // Get group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_conversations')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get members for each group
      const { data: allMembersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles(id, display_name)
        `)
        .in('group_id', groupIds);

      if (membersError) throw membersError;

      // Get messages for groups
      const { data: groupMessagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('group_conversation_id', groupIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const processedGroups = groupsData?.map(group => {
        const groupMembers = allMembersData?.filter(m => m.group_id === group.id) || [];
        const groupMessages = groupMessagesData?.filter(msg => msg.group_conversation_id === group.id) || [];
        const lastMessage = groupMessages.length > 0 ? groupMessages[0] : null;
        const unreadCount = groupMessages.filter(msg => 
          msg.sender_id !== user.id && !msg.read_at
        ).length;

        return {
          ...group,
          members: groupMembers.map(m => m.profiles).filter(Boolean),
          last_message: lastMessage,
          unread_count: unreadCount
        };
      }) || [];

      setGroupConversations(processedGroups);
    } catch (error) {
      console.error('Error fetching group conversations:', error);
    }
  };

  const fetchMessages = async (conversationId?: string, groupId?: string) => {
    if (!user) return;

    try {
      setMessagesLoading(true);
      
      let query = supabase.from('messages').select('*');
      
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (groupId) {
        query = query.eq('group_conversation_id', groupId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch messages",
        variant: "destructive" 
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const createOrGetConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
        .single();

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert([{
          participant_1: user.id,
          participant_2: otherUserId
        }])
        .select('id')
        .single();

      if (error) throw error;

      await fetchConversations(); // Refresh conversations
      return newConv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create conversation",
        variant: "destructive" 
      });
      return null;
    }
  };

  const createGroupConversation = async (name: string, description: string, memberIds: string[]) => {
    if (!user) return null;

    try {
      const { data: group, error: groupError } = await supabase
        .from('group_conversations')
        .insert([{
          name,
          description,
          created_by: user.id
        }])
        .select('id')
        .single();

      if (groupError) throw groupError;

      // Add creator and members
      const members = [user.id, ...memberIds].map(userId => ({
        group_id: group.id,
        user_id: userId
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(members);

      if (membersError) throw membersError;

      await fetchGroupConversations();
      return group.id;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  };

  const addMember = async (groupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: userId }]);

      if (error) throw error;
      await fetchGroupConversations();
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      return false;
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      await fetchGroupConversations();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  const sendGroupMessage = async (groupId: string, content: string) => {
    return await sendMessage(content, undefined, groupId);
  };

  const fetchGroupMessages = async (groupId: string) => {
    return await fetchMessages(undefined, groupId);
  };

  const sendMessage = async (content: string, conversationId?: string, groupId?: string) => {
    if (!user) return false;

    try {
      const messageData: any = {
        sender_id: user.id,
        content: content
      };

      if (conversationId) {
        messageData.conversation_id = conversationId;
      } else if (groupId) {
        messageData.group_conversation_id = groupId;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      if (conversationId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        await fetchMessages(conversationId);
      } else if (groupId) {
        await fetchMessages(undefined, groupId);
      }
      
      await fetchConversations();
      await fetchGroupConversations();
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedGroupId(null);
    fetchMessages(conversationId);
  };

  const selectGroupConversation = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedConversationId(null);
    fetchMessages(undefined, groupId);
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchGroupConversations();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          if (selectedConversationId) {
            fetchMessages(selectedConversationId);
          } else if (selectedGroupId) {
            fetchMessages(undefined, selectedGroupId);
          }
          fetchConversations();
          fetchGroupConversations();
        }
      )
      .subscribe();

    const groupMembersSubscription = supabase
      .channel('group_members')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        () => {
          fetchGroupConversations();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      groupMembersSubscription.unsubscribe();
    };
  }, [user, selectedConversationId, selectedGroupId]);

  return {
    conversations,
    groupConversations,
    messages,
    selectedConversationId,
    selectedGroupId,
    loading,
    messagesLoading,
    createOrGetConversation,
    createGroupConversation,
    addMember,
    removeMember,
    sendMessage,
    sendGroupMessage,
    fetchGroupMessages,
    selectConversation,
    selectGroupConversation,
    refetch: () => {
      fetchConversations();
      fetchGroupConversations();
    }
  };
};