import { Client, GatewayIntentBits, Events, ActivityType, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, async () => {
    client.user?.setPresence({
        activities: [{
            name: 'CFX Finder',
            type: ActivityType.Playing,
        }],
        status: 'online'
    });

    const commands = client.application?.commands;
    if (commands) {
        await commands.create(
            new SlashCommandBuilder()
                .setName('find')
                .setDescription('Information about a FiveM server.')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the server you want to search.')
                        .setRequired(true)
                )
        );
    }

    console.log(`¡Bot ${client.user?.tag} online!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;
    

    if (commandName === 'find') {
        const id = options.getString('id');
        const channel = process.env.channelID

        if (interaction.channel.id != channel) {
            interaction.reply({ 
                content: `This is not the correct channel, try in <#${channel}>`, 
                ephemeral: true,
            });
            return;
        }

        if (id) {
            try {
                const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${id}`);
                
                if (!response.ok) {
                    throw new Error('API not available or server not found.');
                }

                const data = await response.json();
                //console.log(data)
                if (data && data.Data) {
                    const serverData = data.Data;
                    const connectEndPoints = serverData.connectEndPoints && serverData.connectEndPoints.length > 0 ? serverData.connectEndPoints[0] : 'Not available';
                    const players = serverData.players.length || 0; 

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`Información del servidor`)
                        .addFields(
                            { name: 'Server IP', value: connectEndPoints, inline: true },
                            { name: 'Connected players', value: `${players}`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.reply('No information could be found for that server.');
                }
            } catch (error) {
                console.error(error);
                await interaction.reply('It seems that the FiveM API is temporarily down. Please try again later..');
            }
        } else {
            await interaction.reply('Please provide a valid Server ID.');
        }
    }
});

client.login(process.env.token);
