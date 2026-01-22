import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Phone,
  Filter,
  Send,
  Reply,
  ChevronRight,
  User,
} from 'lucide-react';

interface Message {
  id: number;
  customerId: number;
  customerName: string;
  channel: 'email' | 'sms' | 'phone';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: string;
  read: boolean;
  relatedTo?: { type: 'job' | 'quote' | 'invoice'; id: number; number: string };
}

const channelTabs = [
  { key: 'all', label: 'All', icon: <MessageSquare size={16} /> },
  { key: 'email', label: 'Email', icon: <Mail size={16} /> },
  { key: 'sms', label: 'SMS', icon: <MessageSquare size={16} /> },
  { key: 'phone', label: 'Phone', icon: <Phone size={16} /> },
];

const MessageListPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMessages: Message[] = [
        {
          id: 1,
          customerId: 1,
          customerName: 'Performance Motors',
          channel: 'email',
          direction: 'inbound',
          subject: 'Re: Quote for 350 SBC Rebuild',
          content: 'Thanks for the quote. We would like to proceed with the rebuild. When is the earliest you can schedule us?',
          timestamp: '2024-01-22T10:30:00Z',
          read: false,
          relatedTo: { type: 'quote', id: 1, number: 'QT-2024-0089' },
        },
        {
          id: 2,
          customerId: 2,
          customerName: 'Mike Johnson',
          channel: 'sms',
          direction: 'inbound',
          content: 'Is my LS3 tune done yet? Need to pick it up today if possible.',
          timestamp: '2024-01-22T09:15:00Z',
          read: false,
          relatedTo: { type: 'job', id: 2, number: 'JOB-2024-0155' },
        },
        {
          id: 3,
          customerId: 3,
          customerName: 'Track Day Garage',
          channel: 'email',
          direction: 'outbound',
          subject: 'Invoice #INV-2024-0230 - Payment Reminder',
          content: 'This is a friendly reminder that your invoice is past due. Please submit payment at your earliest convenience.',
          timestamp: '2024-01-22T08:00:00Z',
          read: true,
          relatedTo: { type: 'invoice', id: 3, number: 'INV-2024-0230' },
        },
        {
          id: 4,
          customerId: 1,
          customerName: 'Performance Motors',
          channel: 'phone',
          direction: 'inbound',
          content: 'Called to check on status of engine rebuild. Left message to call back.',
          timestamp: '2024-01-21T16:45:00Z',
          read: true,
          relatedTo: { type: 'job', id: 1, number: 'JOB-2024-0156' },
        },
        {
          id: 5,
          customerId: 4,
          customerName: 'Robert Davis',
          channel: 'email',
          direction: 'outbound',
          subject: 'Your Quote is Ready',
          content: 'Hi Robert, Please find attached your quote for the rotating assembly balance. Let me know if you have any questions.',
          timestamp: '2024-01-21T14:00:00Z',
          read: true,
          relatedTo: { type: 'quote', id: 4, number: 'QT-2024-0088' },
        },
      ];

      const filtered = activeChannel === 'all'
        ? mockMessages
        : mockMessages.filter((m) => m.channel === activeChannel);

      setMessages(filtered);
      setIsLoading(false);
    };

    loadMessages();
  }, [activeChannel, searchQuery]);

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <Mail size={16} className="text-electric-400" />,
      sms: <MessageSquare size={16} className="text-green-400" />,
      phone: <Phone size={16} className="text-amber-400" />,
    };
    return icons[channel];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-chrome-400 mt-1">
            Customer communications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-electric-500 text-white text-xs rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <Link
          to="/admin/messages/compose"
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Compose
        </Link>
      </div>

      {/* Channel Tabs */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl p-1">
        <div className="flex flex-wrap gap-1">
          {channelTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveChannel(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeChannel === tab.key
                  ? 'bg-electric-500 text-white'
                  : 'text-chrome-400 hover:text-white hover:bg-admin-bg-hover'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
        />
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-chrome-400">
              No messages found
            </div>
          ) : (
            <div className="divide-y divide-admin-border">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={cn(
                    'w-full text-left px-4 py-4 hover:bg-admin-bg-hover transition-colors',
                    !message.read && 'bg-electric-500/5',
                    selectedMessage?.id === message.id && 'bg-admin-bg-hover'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getChannelIcon(message.channel)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-sm font-medium', !message.read ? 'text-white' : 'text-chrome-300')}>
                          {message.customerName}
                        </span>
                        <span className="text-xs text-chrome-500 flex-shrink-0">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      {message.subject && (
                        <p className={cn('text-sm truncate', !message.read ? 'text-white' : 'text-chrome-400')}>
                          {message.subject}
                        </p>
                      )}
                      <p className="text-xs text-chrome-500 truncate mt-1">
                        {message.direction === 'outbound' && 'You: '}
                        {message.content}
                      </p>
                      {message.relatedTo && (
                        <span className="inline-flex items-center mt-2 px-2 py-0.5 bg-admin-bg rounded text-xs text-chrome-400">
                          {message.relatedTo.number}
                        </span>
                      )}
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 rounded-full bg-electric-500 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="bg-admin-bg-card border border-admin-border rounded-xl">
          {selectedMessage ? (
            <>
              <div className="px-6 py-4 border-b border-admin-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-admin-bg flex items-center justify-center">
                      <User size={20} className="text-chrome-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{selectedMessage.customerName}</p>
                      <p className="text-sm text-chrome-400">
                        {selectedMessage.channel} • {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors">
                      <Reply size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {selectedMessage.subject && (
                  <h3 className="text-lg font-medium text-white mb-4">{selectedMessage.subject}</h3>
                )}
                <p className="text-chrome-300 whitespace-pre-wrap">{selectedMessage.content}</p>
                {selectedMessage.relatedTo && (
                  <Link
                    to={`/admin/${selectedMessage.relatedTo.type}s/${selectedMessage.relatedTo.id}`}
                    className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-admin-bg hover:bg-admin-bg-hover rounded-lg text-sm text-chrome-300 hover:text-white transition-colors"
                  >
                    Related: {selectedMessage.relatedTo.number}
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
              <div className="px-6 py-4 border-t border-admin-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
                  />
                  <button className="px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-chrome-500">
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageListPage;
