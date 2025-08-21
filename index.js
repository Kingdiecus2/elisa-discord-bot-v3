require('dotenv').config(); // load .env locally (ignored in GitHub)

// Discord.js setup
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const express = require('express'); // only if using webserver for uptime pings
const app = express();
const PORT = process.env.PORT || 10000;

// Initialize client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

// Load Discord token from environment variable
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('⚠️ DISCORD_TOKEN not set! Please configure environment variables.');
    process.exit(1);
}

// Handle optional images folder
let images = [];
if (fs.existsSync('./images')) {
    images = fs.readdirSync('./images');
} else {
    console.log('Images folder not found, skipping image commands.');
}

// Handle optional audio folder
let audio = [];
if (fs.existsSync('./audio')) {
    audio = fs.readdirSync('./audio');
} else {
    console.log('Audio folder not found, skipping audio commands.');
}

// Discord ready
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Example message command
client.on('messageCreate', msg => {
    if (msg.content === '!ping') {
        msg.reply('Pong!');
    }
});

// Login
client.login(token);

// Simple ping server for uptime
app.get('/', (req, res) => res.send('Bot is running.'));
app.listen(PORT, () => console.log(`Ping server running on port ${PORT}`));
