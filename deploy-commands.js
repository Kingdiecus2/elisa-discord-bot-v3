const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder().setName('futa').setDescription('Sends a random image'),
  new SlashCommandBuilder().setName('mommy').setDescription('Plays mommy audio'),
  new SlashCommandBuilder().setName('party').setDescription('Moves everyone to Party VC and plays party.mp3'),
  new SlashCommandBuilder().setName('noparty').setDescription('Moves everyone back to Main VC and stops the bot'),
  new SlashCommandBuilder().setName('mute').setDescription('Randomly server-mutes one person in a VC'),
  new SlashCommandBuilder().setName('unmute').setDescription('Randomly un-mutes one person in a VC')
].map(command => command.toJSON());


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error(error);
  }
})();
