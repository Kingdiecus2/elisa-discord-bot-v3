require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// ---------- EXPRESS PING SERVER ----------
const app = express();
app.get('/', (req, res) => res.send('Elisa Bot is online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ping server running on port ${PORT}`));

// ---------- ASSET LOADING ----------
const imagesPath = path.join(__dirname, 'images');
let imageFiles = [];
try {
    imageFiles = fs.readdirSync(imagesPath);
} catch (err) {
    console.warn('Images folder not found, skipping image commands.');
}

const audioPath = path.join(__dirname, 'audio');
let audioFiles = [];
try {
    audioFiles = fs.readdirSync(audioPath).filter(f => f.endsWith('.mp3'));
} catch (err) {
    console.warn('Audio folder not found, skipping voice commands.');
}

// ---------- SLASH COMMANDS ----------
const commands = [
    {
        name: 'futa',
        description: 'Sends a random image from the images folder.'
    },
    {
        name: 'mommy',
        description: 'Plays a random mommy audio in Main VC.'
    },
    {
        name: 'party',
        description: 'Moves everyone to Party VC and plays party.mp3'
    },
    {
        name: 'noparty',
        description: 'Moves everyone back to Main VC and disconnects bot.'
    },
    {
        name: 'mute',
        description: 'Mutes a random member in VC.'
    },
    {
        name: 'unmute',
        description: 'Unmutes a random member in VC.'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (err) {
        console.error(err);
    }
})();

// ---------- COMMAND HANDLER ----------
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // ---------- /futa ----------
    if (commandName === 'futa') {
        if (!imageFiles.length) return interaction.reply({ content: 'No images found.', ephemeral: false });
        const chosen = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        await interaction.reply({ content: { files: [path.join(imagesPath, chosen)] }, ephemeral: false });
    }

    // ---------- /mommy ----------
    if (commandName === 'mommy') {
        if (!audioFiles.length) return interaction.reply({ content: 'No audio files found.', ephemeral: false });

        const mainChannel = interaction.guild.channels.cache.find(
            ch => ch.type === 2 && ch.name.toLowerCase() === 'main'
        );
        if (!mainChannel) return interaction.reply({ content: 'Main VC not found.', ephemeral: false });

        const connection = joinVoiceChannel({
            channelId: mainChannel.id,
            guildId: mainChannel.guild.id,
            adapterCreator: mainChannel.guild.voiceAdapterCreator
        });

        const player = createAudioPlayer();
        const chosenAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        const resource = createAudioResource(path.join(audioPath, chosenAudio));

        connection.subscribe(player);
        player.play(resource);

        interaction.reply({ content: 'Playing mommy audio!', ephemeral: false });

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());
    }

    // ---------- /party ----------
    if (commandName === 'party') {
        const partyVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.name.toLowerCase() === 'party');
        const mainVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.name.toLowerCase() === 'main');
        if (!partyVC || !mainVC) return interaction.reply({ content: 'VCs not found.', ephemeral: false });

        const members = mainVC.members.filter(m => !m.user.bot);
        for (const [id, member] of members) await member.voice.setChannel(partyVC);

        const connection = joinVoiceChannel({
            channelId: partyVC.id,
            guildId: partyVC.guild.id,
            adapterCreator: partyVC.guild.voiceAdapterCreator
        });
        const player = createAudioPlayer();
        const partyAudioPath = path.join(audioPath, 'party.mp3');
        if (fs.existsSync(partyAudioPath)) {
            player.play(createAudioResource(partyAudioPath));
            connection.subscribe(player);
            player.on(AudioPlayerStatus.Idle, () => connection.destroy());
        }

        interaction.reply({ content: 'Party time! 🎉', ephemeral: false });
    }

    // ---------- /noparty ----------
    if (commandName === 'noparty') {
        const mainVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.name.toLowerCase() === 'main');
        const partyVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.name.toLowerCase() === 'party');
        if (!mainVC || !partyVC) return interaction.reply({ content: 'VCs not found.', ephemeral: false });

        const members = partyVC.members.filter(m => !m.user.bot);
        for (const [id, member] of members) await member.voice.setChannel(mainVC);

        interaction.reply({ content: 'Party over. Back to Main VC.', ephemeral: false });
    }

    // ---------- /mute ----------
    if (commandName === 'mute') {
        const mainVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.members.size > 1);
        if (!mainVC) return interaction.reply({ content: 'No members to mute.', ephemeral: false });

        const members = mainVC.members.filter(m => !m.user.bot);
        const memberArray = Array.from(members.values());
        const target = memberArray[Math.floor(Math.random() * memberArray.length)];
        await target.voice.setMute(true);
        interaction.reply({ content: `Muted ${target.user.tag}`, ephemeral: false });
    }

    // ---------- /unmute ----------
    if (commandName === 'unmute') {
        const mainVC = interaction.guild.channels.cache.find(ch => ch.type === 2 && ch.members.size > 1);
        if (!mainVC) return interaction.reply({ content: 'No members to unmute.', ephemeral: false });

        const members = mainVC.members.filter(m => !m.user.bot);
        const memberArray = Array.from(members.values());
        const target = memberArray[Math.floor(Math.random() * memberArray.length)];
        await target.voice.setMute(false);
        interaction.reply({ content: `Unmuted ${target.user.tag}`, ephemeral: false });
    }
});

// ---------- LOGIN ----------
client.login(process.env.DISCORD_TOKEN);
