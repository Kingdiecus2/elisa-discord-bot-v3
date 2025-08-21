// index.js
require('dotenv').config(); // Only for local testing
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

// ----------------- Environment Variables -----------------
const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
    console.error('⚠️ DISCORD_TOKEN not set! Set it in environment variables.');
    process.exit(1);
}

// ----------------- Discord Bot Setup -----------------
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle login errors
client.login(TOKEN).catch(err => {
    console.error('❌ Failed to login. Check your token!', err);
    process.exit(1);
});

// ----------------- Safe folder access -----------------
const IMAGES_DIR = path.join(__dirname, 'images');
const AUDIO_DIR = path.join(__dirname, 'audio');

let images = [];
let audioFiles = [];

try {
    if (fs.existsSync(IMAGES_DIR)) images = fs.readdirSync(IMAGES_DIR);
} catch (e) {
    console.warn('⚠️ Images folder missing or unreadable, skipping image commands.');
}

try {
    if (fs.existsSync(AUDIO_DIR)) audioFiles = fs.readdirSync(AUDIO_DIR);
} catch (e) {
    console.warn('⚠️ Audio folder missing or unreadable, skipping audio commands.');
}

// ----------------- Ping Server -----------------
const app = express();

app.get('/', (req, res) => {
    res.send('Ping received. Bot is alive!');
});

app.listen(PORT, () => {
    console.log(`📡 Ping server running on port ${PORT}`);
});

// ----------------- Example Command -----------------
client.on('messageCreate', message => {
    if (message.content.toLowerCase() === '!ping') {
        message.channel.send('Pong!');
    }
});
