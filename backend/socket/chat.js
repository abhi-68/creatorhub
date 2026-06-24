const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getConvId = (a, b) => [a, b].sort().join('_');

module.exports = (io) => {
  // Middleware: authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);
    onlineUsers.set(socket.userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // Join personal room
    socket.join(socket.userId);

    // Send a message
    socket.on('send_message', async ({ receiverId, content }) => {
      if (!content?.trim() || !receiverId) return;
      if (content.trim().length > 2000) {
        socket.emit('error', { message: 'Message too long (max 2000 chars)' });
        return;
      }
      try {
        const convId = getConvId(socket.userId, receiverId);
        const message = await Message.create({
          conversationId: convId,
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim(),
        });
        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        // Emit to both sender and receiver rooms
        io.to(socket.userId).to(receiverId).emit('new_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      socket.to(receiverId).emit('user_typing', { senderId: socket.userId, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`Socket disconnected: ${socket.userId}`);
    });
  });
};
