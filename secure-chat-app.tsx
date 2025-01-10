import React, { useState, useEffect } from 'react';
import { Send, Lock, MoreVertical, Phone, Video, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SecureChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Alice', content: 'Hey! How are you?', timestamp: '10:30 AM', status: 'read' },
    { id: 2, sender: 'You', content: "I'm doing great! Thanks for asking.", timestamp: '10:31 AM', status: 'sent' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: 'You',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div>
                <CardTitle>Alice</CardTitle>
                {isEncrypted && (
                  <div className="flex items-center text-sm text-green-600">
                    <Lock className="w-3 h-3 mr-1" />
                    Encrypted
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900" />
              <Video className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900" />
              <MoreVertical className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-96 overflow-y-auto py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'You'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-xs opacity-75">{message.timestamp}</span>
                    {message.sender === 'You' && (
                      <span className="text-xs opacity-75">
                        {message.status === 'read' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="mt-4 flex items-center space-x-2">
            <Image className="w-6 h-6 text-gray-500 cursor-pointer" />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 focus:outline-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureChat;
