const mongoose = require('mongoose');
const { client } = require('../../lib/providers/discord'); // Uses the shared client
const { connect } = require('../../lib/db');
const Thread = require('../../models/Thread');
const Message = require('../../models/Message');

// This function will be called by the event listener we set up on the client
async function handleNewMessage(msg) {
  // Ignore messages from other bots
  if (msg.author.bot) return;

  try {
    await connect();

    // Log the incoming message for debugging
    console.log('Discord msg received and processing:', {
      channelId: msg.channel.id,
      from: msg.author.id,
      text: msg.content,
    });

    // All incoming messages are assigned to the DEMO_USER_ID
    const demoUserId = new mongoose.Types.ObjectId(process.env.DEMO_USER_ID);

    const provider = 'discord';
    const providerThreadId = String(msg.channel.id);
    const providerMessageId = String(msg.id);

    // Find or create a thread for this Discord channel
    const title = msg.channel.name || `Discord Chat ${msg.channel.id}`;
    const when = new Date(msg.createdTimestamp);

    const thread = await Thread.findOneAndUpdate(
      { userId: demoUserId, provider, providerThreadId },
      {
        $setOnInsert: {
          userId: demoUserId,
          provider,
          providerThreadId,
          title,
          lastMessageAt: when,
        },
      },
      { new: true, upsert: true }
    );

    // Save the new message to the database
    await Message.updateOne(
      { provider, providerMessageId },
      {
        $setOnInsert: {
          userId: demoUserId,
          provider,
          providerMessageId,
          threadId: thread._id,
          direction: 'in',
          senderName: msg.author.username,
          senderId: String(msg.author.id),
          text: msg.content,
          sentAt: when,
          raw: msg.toJSON(),
        },
      },
      { upsert: true }
    );

    // Update the last message time for the thread
    await Thread.updateOne({ _id: thread._id }, { $set: { lastMessageAt: new Date() } });
    console.log(`SUCCESS: Saved Discord message from ${msg.author.username} to the database.`);

  } catch (err) {
    console.error('Error handling Discord message:', err);
  }
}

// Attach the message handler to the Discord client's 'messageCreate' event
client.on('messageCreate', handleNewMessage);

// The webhook endpoint itself just confirms the bot's status for Vercel
module.exports = (req, res) => {
  if (client.isReady()) {
    res.status(200).send(`Discord bot is logged in as ${client.user.tag} and listening for messages.`);
  } else {
    res.status(500).send('Discord bot is not logged in or is starting.');
  }
};
