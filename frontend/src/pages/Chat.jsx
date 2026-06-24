import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { PaperAirplaneIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function Chat() {
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations list
  useEffect(() => {
    api.get('/chat/conversations').then((res) => setConversations(res.data)).catch(console.error);
  }, []);

  // Open conversation from URL param
  useEffect(() => {
    if (paramUserId) openConversation(paramUserId);
  }, [paramUserId]);

  const openConversation = async (uid) => {
    try {
      const [msgRes, userRes] = await Promise.all([
        api.get(`/chat/${uid}`),
        api.get(`/vendors/${uid}`).catch(() => api.get(`/users/profile`)),
      ]);
      setMessages(msgRes.data);
      setActiveUser(userRes.data._id ? userRes.data : { _id: uid, name: 'User' });
      navigate(`/chat/${uid}`, { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (msg) => {
      const peerId = activeUser?._id;
      const isRelevant = msg.sender._id === peerId || msg.receiver._id === peerId;
      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);
      }
      // Refresh conversations
      api.get('/chat/conversations').then((res) => setConversations(res.data));
    });
    socket.on('user_typing', ({ senderId, isTyping }) => {
      if (senderId === activeUser?._id) setPeerTyping(isTyping);
    });
    return () => { socket.off('new_message'); socket.off('user_typing'); };
  }, [socket, activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeUser) return;
    socket?.emit('send_message', { receiverId: activeUser._id, content: input.trim() });
    setInput('');
    socket?.emit('typing', { receiverId: activeUser._id, isTyping: false });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !activeUser) return;
    socket.emit('typing', { receiverId: activeUser._id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { receiverId: activeUser._id, isTyping: false });
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex h-[calc(100vh-10rem)] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Sidebar: Conversations */}
        <div className={`${activeUser ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-gray-800`}>
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white text-lg">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">No conversations yet</p>
                <Link to="/explore" className="text-primary-400 text-sm hover:underline mt-2 block">Find creators to message</Link>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => openConversation(conv.participant._id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-800 transition-colors text-left ${activeUser?._id === conv.participant._id ? 'bg-gray-800' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.participant.avatar ? (
                      <img src={conv.participant.avatar} alt={conv.participant.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm font-bold">
                        {conv.participant.name?.[0]}
                      </div>
                    )}
                    {isOnline(conv.participant._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-white text-sm truncate">{conv.participant.name}</p>
                      {conv.unread > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0">{conv.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        {activeUser ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <button onClick={() => { setActiveUser(null); navigate('/chat'); }} className="sm:hidden text-gray-400 hover:text-white">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="relative">
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm font-bold">
                    {activeUser.name?.[0]}
                  </div>
                )}
                {isOnline(activeUser._id) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />}
              </div>
              <div>
                <p className="font-semibold text-white">{activeUser.name}</p>
                <p className="text-xs text-gray-500">{isOnline(activeUser._id) ? '🟢 Online' : 'Offline'}</p>
              </div>
              {activeUser.role === 'vendor' && (
                <Link to={`/vendors/${activeUser._id}`} className="ml-auto text-xs text-primary-400 hover:underline">View Profile</Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender._id === user._id || msg.sender === user._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-500'}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {peerTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-3">
              <input
                value={input}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="input flex-1 py-2.5"
                autoFocus
              />
              <button type="submit" disabled={!input.trim()} className="btn-primary px-4 py-2.5 disabled:opacity-40">
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-center text-gray-500">
            <div>
              <div className="text-5xl mb-4">💬</div>
              <p className="text-lg font-medium text-gray-400">Select a conversation</p>
              <p className="text-sm mt-1">or <Link to="/explore" className="text-primary-400 hover:underline">find a creator</Link> to message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
