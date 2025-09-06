import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ArrowLeft, Users, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useMessages";
import { useModerationSystem } from "@/hooks/useModerationSystem";

const Messages = () => {
  const navigate = useNavigate();
  const { moderateContent } = useModerationSystem();
  const {
    conversations,
    groupConversations,
    messages,
    selectedConversationId,
    selectedGroupId,
    loading,
    sendMessage,
    selectConversation,
    selectGroupConversation,
    createGroupConversation
  } = useMessages();
  
  const [newMessage, setNewMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [activeTab, setActiveTab] = useState("direct");

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedConversationId && !selectedGroupId) return;

    if (!moderateContent(newMessage)) {
      return;
    }

    const success = await sendMessage(newMessage, selectedConversationId || undefined, selectedGroupId || undefined);
    if (success) {
      setNewMessage("");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const groupId = await createGroupConversation(newGroupName, "Group discussion", []);
    if (groupId) {
      setNewGroupName("");
      setShowCreateGroup(false);
      selectGroupConversation(groupId);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversationId);
  const selectedGroup = groupConversations.find(g => g.id === selectedGroupId);
  const isGroupChat = !!selectedGroupId;
  const hasSelection = selectedConversationId || selectedGroupId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 h-[500px] sm:h-[600px]">
          {/* Conversations List */}
          <Card className={`lg:col-span-1 ${hasSelection ? 'hidden lg:block' : ''}`}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">Messages</CardTitle>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCreateGroup}>Create</Button>
                      <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="direct" className="mt-0">
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 border-b ${
                          selectedConversationId === conv.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => selectConversation(conv.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{conv.other_participant.display_name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conv.other_participant.display_name || 'Anonymous'}</p>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message?.content || 'No messages yet'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="groups" className="mt-0">
                  <div className="space-y-1">
                    {groupConversations.map((group) => (
                      <div
                        key={group.id}
                        className={`p-3 sm:p-4 cursor-pointer hover:bg-secondary/50 border-b ${
                          selectedGroupId === group.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => navigate(`/group-chat/${group.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{group.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {group.members?.length || 0}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {group.last_message?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`lg:col-span-2 ${!hasSelection ? 'hidden lg:block' : ''}`}>
            {hasSelection ? (
              <>
                <CardHeader className="border-b p-3 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden p-1"
                      onClick={() => {
                        selectConversation('');
                        selectGroupConversation('');
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {isGroupChat ? (
                      <>
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base sm:text-lg truncate">{selectedGroup?.name}</CardTitle>
                      </>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{selectedConv?.other_participant.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-base sm:text-lg truncate">{selectedConv?.other_participant.display_name || 'Anonymous'}</CardTitle>
                      </>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex flex-col h-[350px] sm:h-[400px] p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === "current-user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-2 sm:p-3 rounded-lg ${
                            message.sender_id === "current-user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-3 sm:p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="text-sm sm:text-base"
                      />
                      <Button onClick={handleSendMessage} size="sm" className="px-3">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center px-4">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;