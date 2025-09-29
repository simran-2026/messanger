
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


const startBot = async () => {
  try {
    console.log("Attempting to log in the Discord bot...");
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log(`SUCCESS: Discord bot is ready and logged in as ${client.user.tag}!`);

   
    client.user.setPresence({
      activities: [{ name: 'your messages', type: ActivityType.Watching }],
      status: 'online',
    });


  } catch (error) {
    console.error("Error logging into Discord:", error.message);
  }
};


if (process.env.DISCORD_BOT_TOKEN) {
    startBot();
} else {
    console.warn("DISCORD_BOT_TOKEN not found. Discord bot will not be started.");
}

const sendMessage = async (thread, text) => {
  if (!client.isReady()) {
    throw new Error('Discord bot is not connected.');
  }
  try {
    const channel = await client.channels.fetch(thread.providerThreadId);
    if (channel) {
      const message = await channel.send(text);
      return message.toJSON();
    }
    throw new Error('Discord channel not found');
  } catch (error) {
    console.error('Discord send message error:', error);
    throw new Error('Failed to send message to Discord');
  }
};

module.exports = { sendMessage, client };