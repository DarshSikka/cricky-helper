require("dotenv").config();
const { Client, Intents, MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const express = require("express");
const app = express();
const port = process.env.PORT || 9000;
app.get("/", (req, res) => {
  res.send("why u here? nothing to see");
});
app.listen(port, () => console.log(`listening on port ${port}`));
const data = new SlashCommandBuilder()
  .setName("worthy")
  .setDescription("sends the ppl who are worthy")
  .addStringOption((option) =>
    option.setName("role").setDescription("hitter or winner").setRequired(true)
  );
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    "GUILD_MEMBERS",
  ],
  partials: ["CHANNEL"],
});
client.on("ready", (clt) => {
  console.log("the bot is ready");
  const guildId = process.env.SERVER;
  const guild = client.guilds.cache.get(guildId);
  let commands;
  if (guild) {
    commands = guild.commands;
  } else {
    commands = client.application.commands;
  }
  commands.create(data);
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName, options } = interaction;
  if (commandName === "ping") {
    interaction.reply({ content: "pong", ephemeral: false });
  }
  if (commandName === "worthy") {
    const role = interaction.options.getString("role");
    let d;
    if (role === "winner") {
      d = await axios({
        method: "get",
        url: `${process.env.API}/lb?sort=won`,
      });
    } else {
      d = await axios({
        method: "get",
        url: `${process.env.API}/lb?sort=highest`,
      });
    }
    let top5 = d.data.map((ele) => ele.username);
    let str = "";
    top5 = top5.filter((e, i) => i < 5);
    top5.forEach((guy) => (str += guy + "\n"));
    const members = await interaction.channel.guild.members.fetch({
      cache: false,
    });
    let rolegrant;
    let rolegrantid;
    if (role == "winner") {
      rolegrantid = process.env.ROLE1;
      rolegrant = interaction.guild.roles.cache.find(
        (r) => r.id === process.env.ROLE1
      );
    } else {
      rolegrantid = process.env.ROLE2;
      rolegrant = interaction.guild.roles.cache.find(
        (r) => r.id === process.env.ROLE2
      );
    }
    members.forEach((member) => {
      console.log(member.user.tag);
      if (top5.includes(member.user.tag)) {
        console.log(member.tag);
        member.roles.add(rolegrant);
      }
      if (!top5.includes(member.user.tag)) {
        try {
          member.roles.remove(rolegrantid);
        } catch {
          console.log("unsus");
        }
      }
    });
    const embed = new MessageEmbed().setTitle("worthy ppl").setDescription(str);
    interaction.reply({ embeds: [embed] });
  }
});
client.login(process.env.TOKEN);
