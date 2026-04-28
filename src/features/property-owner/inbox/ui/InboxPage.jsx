import { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/data/constants";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Search, Send, MessageSquare, MoreVertical, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InboxPage = () => {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0]?.id);
  const [messagesData, setMessagesData] = useState(MOCK_MESSAGES);
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find(c => c.id === activeId);
  const activeMessages = messagesData[activeId] || [];

  const filteredConversations = conversations.filter(c =>
    c.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.resort.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSelectConversation = (id) => {
    setActiveId(id);
    // Mark as read locally
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeId) return;

    const newMessage = {
      id: `m-${Date.now()}`,
      sender: "host",
      text: replyText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessagesData(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage]
    }));

    // Update snippet and timestamp on the conversation list
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, snippet: `You: ${newMessage.text}`, lastMessageAt: newMessage.timestamp }
        : c
    ));

    setReplyText("");
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden -mx-2 sm:mx-0">

      {/* Left Pane: Conversation List */}
      <div className="w-1/3 min-w-[280px] max-w-[380px] flex flex-col gap-3">
        {/* Search */}
        <div className="glass-card rounded-2xl p-3 shrink-0 flex items-center gap-2 border border-white/20">
          <Search className="w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search guests or resorts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-foreground/90 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* List */}
        <div className="glass-card rounded-2xl border border-white/20 flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground/60 flex flex-col items-center">
              <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
              No conversations found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map(conv => {
                const isActive = conv.id === activeId;
                const timeStr = format(parseISO(conv.lastMessageAt), "h:mm a");

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${isActive
                      ? "bg-white/40 dark:bg-black/30 shadow-sm border border-white/30"
                      : "hover:bg-white/20 dark:hover:bg-white/10 border border-transparent"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className={`text-sm ${conv.unread ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
                        {conv.guest}
                      </h4>
                      <span className="text-[10px] text-muted-foreground/70 shrink-0 ml-2">{timeStr}</span>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium truncate pr-2">
                        {conv.resort}
                      </span>
                      <PlatformBadge platform={conv.platform} />
                    </div>

                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate flex-1 ${conv.unread ? "font-semibold text-foreground/90" : "text-muted-foreground/70"}`}>
                        {conv.snippet}
                      </p>
                      {conv.unread && (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-1 glass-card rounded-2xl border border-white/20 flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-md flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-green-500/20">
                  {activeConversation.guest.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground/90">{activeConversation.guest}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PlatformBadge platform={activeConversation.platform} />
                    <span className="text-xs text-muted-foreground/70">{activeConversation.resort}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span className="text-xs font-medium text-foreground/80">Mar 28 - Mar 30</span>
                </div>
                <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <MoreVertical className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {activeMessages.map((msg, index) => {
                const isHost = msg.sender === "host";
                const timeStr = format(parseISO(msg.timestamp), "h:mm a");

                return (
                  <div key={msg.id} className={`flex flex-col ${isHost ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm
                      ${isHost
                        ? "bg-green-500 text-white rounded-tr-sm"
                        : "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 text-foreground/90 rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 mt-1 px-1">{timeStr}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/20 bg-background/50 backdrop-blur-md shrink-0">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[44px] max-h-[120px] bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none custom-scrollbar"
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="h-11 w-11 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 shrink-0 p-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </form>
              <div className="text-[10px] text-muted-foreground/50 mt-2 text-center">
                Press Enter to send, Shift + Enter for new line. Message will be sent via {activeConversation.platform}.
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
};
