// In api/app/send.js
const { connect } = require('../../lib/db');
const Thread = require('../../models/Thread');
const Message = require('../../models/Message');

const providers = {
  telegram: require('../../lib/providers/telegram'),
  discord: require('../../lib/providers/discord'),
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { threadId, text, replyToProviderMessageId } = req.body || {};
    if (!threadId || !text) {
      return res.status(400).json({ ok: false, error: 'threadId and text are required' });
    }

    await connect();
    const thread = await Thread.findById(threadId);
    if (!thread) return res.status(404).json({ ok: false, error: 'Thread not found' });

    const provider = providers[thread.provider];
    if (!provider) {
      return res.status(400).json({ ok: false, error: `Provider ${thread.provider} not supported yet` });
    }

    const sentMessage = await provider.sendMessage(thread, text, replyToProviderMessageId);
    const providerMessageId = String(sentMessage.id || sentMessage.message_id);
    const when = new Date(sentMessage.createdTimestamp || (sentMessage.date * 1000) || Date.now());

    // --- THIS IS THE FIX ---
    // We changed Message.create to Message.updateOne with upsert to prevent duplicate errors.
    await Message.updateOne({
      provider: thread.provider,
      providerMessageId,
    }, {
      $setOnInsert: {
        userId: thread.userId,
        provider: thread.provider,
        providerMessageId,
        threadId: thread._id,
        direction: 'out',
        senderName: 'Bot', // Or your bot's name
        senderId: 'bot', // Or your bot's ID
        text,
        sentAt: when,
        raw: sentMessage,
      }
    }, { upsert: true });
    // --- END OF FIX ---

    await Thread.updateOne({ _id: thread._id }, { $set: { lastMessageAt: new Date() } });

    return res.json({ ok: true, result: sentMessage });
  } catch (err) {
    console.error('send error', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
};