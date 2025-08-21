require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // your bot's ID
const GUILD_ID = process.env.GUILD_ID;   // optional: for testing in a single server

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- Register slash commands ---
const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!'
    },
    {
        name: 'hello',
        description: 'Say hello to the bot'
    }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔄 Registering commands...');
        // Use GUILD_ID for testing only, otherwise omit for global commands
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('✅ Commands registered!');
    } catch (err) {
        console.error(err);
    }
})();

// --- Slash command handling ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
    if (interaction.commandName === 'hello') {
        await interaction.reply(`Hello, ${interaction.user.username}!`);
    }
});

// --- Message command fallback (optional) ---
client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!ping') {
        message.channel.send('Pong!');
    }
});

// --- Login ---
client.login(TOKEN);
