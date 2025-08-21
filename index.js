const { Client, Events, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// /futa command - sends a random image
const imagesFolder = path.join(__dirname, 'images');
const imageFiles = fs.readdirSync(imagesFolder);

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // -------- /futa --------
  if (interaction.commandName === 'futa') {
    if (imageFiles.length === 0) {
      await interaction.reply({ content: 'No images found!' });
      return;
    }
    const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
    await interaction.reply({ files: [path.join(imagesFolder, randomImage)] });
  }

  // -------- /mommy --------
  if (interaction.commandName === 'mommy') {
    const audioFiles = [
      path.join(__dirname,  'mommy.mp3'),
      path.join(__dirname,  'mommy2.mp3')
    ];
    const chosenAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];

    // Try "Main" VC first, fallback to user VC
    let mainChannel = interaction.guild.channels.cache.find(
      ch => ch.type === 2 && ch.name.toLowerCase() === 'main'
    );
    if (!mainChannel) mainChannel = interaction.member.voice.channel;
    if (!mainChannel) {
      await interaction.reply({ content: 'No suitable voice channel found.' });
      return;
    }

    const connection = joinVoiceChannel({
      channelId: mainChannel.id,
      guildId: mainChannel.guild.id,
      adapterCreator: mainChannel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(chosenAudio);

    connection.subscribe(player);
    player.play(resource);

    await interaction.reply({ content: `Playing mommy audio in ${mainChannel.name}!` });

    player.on(AudioPlayerStatus.Idle, () => connection.destroy());
  }

  // -------- /party --------
  if (interaction.commandName === 'party') {
    const partyChannel = interaction.guild.channels.cache.find(
      ch => ch.type === 2 && ch.name.toLowerCase() === 'party'
    );

    if (!partyChannel) {
      await interaction.reply({ content: 'Party VC not found.', flags: 64 });
      return;
    }

    // Move everyone in VC to Party
    interaction.guild.members.cache.forEach(member => {
      if (member.voice.channel) member.voice.setChannel(partyChannel).catch(() => {});
    });

    const partyAudio = path.join(__dirname, 'party.mp3');
    const connection = joinVoiceChannel({
      channelId: partyChannel.id,
      guildId: partyChannel.guild.id,
      adapterCreator: partyChannel.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(partyAudio);

    connection.subscribe(player);
    player.play(resource);

    await interaction.reply({ content: 'Party started! 🎉' });

    player.on(AudioPlayerStatus.Idle, () => connection.destroy());
  }

  // -------- /noparty --------
  if (interaction.commandName === 'noparty') {
    const mainChannel = interaction.guild.channels.cache.find(
      ch => ch.type === 2 && ch.name.toLowerCase() === 'main'
    );

    if (!mainChannel) {
      await interaction.reply({ content: 'Main VC not found.', flags: 64 });
      return;
    }

    // Move everyone in VC back to Main
    interaction.guild.members.cache.forEach(member => {
      if (member.voice.channel) member.voice.setChannel(mainChannel).catch(() => {});
    });

    // Disconnect any active voice connection
    const connection = getVoiceConnection(interaction.guild.id);
    if (connection) connection.destroy();

    await interaction.reply({ content: 'Party ended, everyone moved back to Main VC.' });
  }

  if (interaction.commandName === 'mute') {
  // Get all members currently in a voice channel
  const membersInVC = interaction.guild.members.cache.filter(
    member => member.voice.channel
  );

  if (membersInVC.size === 0) {
    await interaction.reply({ content: 'No one is in a voice channel to mute!' });
    return;
  }

  // Pick a random member
  const randomMember = membersInVC.random();

  // Server-mute the member
  randomMember.voice.setMute(true).catch(() => {});

  await interaction.reply({ content: `${randomMember.user.username} has been randomly muted! 🔇`});
}

if (interaction.commandName === 'unmute') {
  // Get all members currently muted in a voice channel
  const mutedMembers = interaction.guild.members.cache.filter(
    member => member.voice.channel && member.voice.serverMute
  );

  if (mutedMembers.size === 0) {
    await interaction.reply({ content: 'No muted members in a voice channel!' });
    return;
  }

  // Pick a random member
  const randomMember = mutedMembers.random();

  // Unmute the member
  randomMember.voice.setMute(false).catch(() => {});

  await interaction.reply({ content: `${randomMember.user.username} has been unmuted! 🔊` });
}

});

client.login(process.env.DISCORD_TOKEN);
