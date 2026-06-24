const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Build a stable conversation ID from two user IDs
const getConvId = (a, b) => [a, b].sort().join('_');

// @GET /api/chat/conversations — list all people this user has chatted with
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const other = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const convId = getConvId(userId, other._id.toString());
      if (!seen.has(convId)) {
        seen.add(convId);
        const unread = await Message.countDocuments({ conversationId: convId, receiver: req.user._id, read: false });
        conversations.push({ conversationId: convId, participant: other, lastMessage: msg, unread });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/chat/:userId — get messages with a specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const convId = getConvId(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ conversationId: convId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany({ conversationId: convId, receiver: req.user._id, read: false }, { read: true });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/chat/:userId — send a message (REST fallback)
router.post('/:userId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });
    if (content.trim().length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars)' });

    const receiver = await User.findById(req.params.userId).select('_id isActive');
    if (!receiver || !receiver.isActive) return res.status(404).json({ error: 'User not found' });

    const convId = getConvId(req.user._id.toString(), req.params.userId);
    const message = await Message.create({
      conversationId: convId,
      sender: req.user._id,
      receiver: req.params.userId,
      content: content.trim(),
    });
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
