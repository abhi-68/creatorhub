import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../lib/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/unread');
      setTotalUnread(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); setSocket(null); }
      setTotalUnread(0);
      return;
    }

    fetchUnread();

    const token = localStorage.getItem('token');
    // No transport restriction — allows WebSocket with long-polling fallback
    const s = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('online_users', (users) => setOnlineUsers(users));

    // Increment unread badge when a new message is addressed to me
    s.on('new_message', (msg) => {
      const receiverId = msg.receiver?._id ?? msg.receiver;
      if (receiverId === user._id) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [user?._id]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isOnline, totalUnread, fetchUnread }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
