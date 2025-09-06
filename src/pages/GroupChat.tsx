import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Users, Send, UserPlus, UserMinus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const GroupChat = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { 
    groupConversations, 
    messages, 
    sendGroupMessage, 
    fetchGroupMessages,
    addMember,
    removeMember,
    selectGroupConversation 
  } = useMessages();
  
  const [newMessage, setNewMessage] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentGroup = groupConversations.find(g => g.id === groupId);

  useEffect(() => {
    if (groupId) {
      selectGroupConversation(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !groupId) return;

    const success = await sendGroupMessage(groupId, newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !groupId) return;
    
    // In a real app, you'd look up user by email
    // For now, assuming you have the user ID
    const success = await addMember(groupId, newMemberEmail);
    if (success) {
      setNewMemberEmail('');
      toast({ title: "Member added successfully" });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!groupId) return;
    
    const success = await removeMember(groupId, userId);
    if (success) {
      toast({ title: "Member removed" });
    }
  };

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Group not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {currentGroup.name}
              <Badge variant="secondary">{currentGroup.members?.length || 0} members</Badge>
            </CardTitle>
            <Dialog open={showMembers} onOpenChange={setShowMembers}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Members</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="User ID to add"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                    <Button onClick={handleAddMember} size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentGroup.members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{member.display_name || 'Anonymous'}</span>
                        {currentGroup.created_by === user?.id && member.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupChat;