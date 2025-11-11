import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Clock, CheckCheck, Phone } from "lucide-react";

const chatHistory = [
  {
    id: 1,
    date: "Nov 28, 2024",
    messages: [
      { sender: "client", text: "Hello, I need help with the payment integration", time: "10:30 AM" },
      { sender: "support", text: "Hi! I'd be happy to help you with that. What specific issue are you facing?", time: "10:32 AM" },
      { sender: "client", text: "The Razorpay webhook isn't working properly", time: "10:35 AM" },
      { sender: "support", text: "Let me check your configuration. Can you share the error message?", time: "10:36 AM" },
      { sender: "client", text: "I'm getting a 401 unauthorized error", time: "10:38 AM" },
      { sender: "support", text: "I see the issue. Your webhook secret needs to be updated. I'll send you the instructions via email.", time: "10:40 AM" },
    ],
    status: "Resolved",
  },
  {
    id: 2,
    date: "Nov 25, 2024",
    messages: [
      { sender: "client", text: "When will the mobile app be ready for testing?", time: "2:15 PM" },
      { sender: "support", text: "The testing build will be ready by end of this week. We'll send you the TestFlight link.", time: "2:20 PM" },
      { sender: "client", text: "Perfect, thank you!", time: "2:21 PM" },
    ],
    status: "Resolved",
  },
];

export default function Support() {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via WhatsApp Web API
      alert("Message would be sent via WhatsApp: " + newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Support Chat</h1>
        <p className="text-muted-foreground">Get help from our support team via in-app messaging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common support options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-gradient-to-r from-success to-emerald-400 hover:opacity-90">
              <MessageSquare className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="h-4 w-4 mr-2" />
              Request Call Back
            </Button>
            <div className="pt-4 space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Support Hours</p>
                <p className="text-sm text-muted-foreground">Mon-Fri: 9 AM - 6 PM IST</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Response Time</p>
                <p className="text-sm text-muted-foreground">Usually within 2 hours</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Email Support</p>
                <p className="text-sm text-muted-foreground">support@comdata.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Messages are routed to ComData support team</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-success to-emerald-400">Online</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Chat */}
            <div className="border rounded-lg">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <Badge variant="outline" className="text-xs">
                      Today
                    </Badge>
                  </div>

                  {/* Support Message */}
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      CS
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          Hello! Welcome to ComData support. How can I help you today?
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        11:30 AM
                      </p>
                    </div>
                  </div>

                  {/* Placeholder for demo */}
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 flex flex-col items-end">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          Hi, I have a question about my recent invoice.
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        11:35 AM
                        <CheckCheck className="h-3 w-3 text-success" />
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      CS
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">
                          I'd be happy to help you with that! Could you please provide the invoice number?
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        11:36 AM
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Messages are sent via WhatsApp Web integration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat History */}
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
          <CardDescription>Previous conversations with support team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{chat.date}</p>
                      <p className="text-sm text-muted-foreground">{chat.messages.length} messages</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-success to-emerald-400">{chat.status}</Badge>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm line-clamp-2">{chat.messages[0].text}</p>
                </div>
                <Button variant="link" className="mt-2 p-0 h-auto">
                  View Full Conversation
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
