require("dotenv").config();
const { Client, Intents, MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require("axios");
const User = require("./User");
const express = require("express");
const lvlToXp = (lvl) => {
  const farenheit = lvl * 1.8 + 232;
  return Math.floor(farenheit);
};
const lvl = {
  5: "919827641715019786",
  10: "919835780116021258",
  20: "919830122943614986",
  50: "919831202733629440",
};
let pplForFiveMins = [];
const app = express();
const cors = require("cors");
app.use(cors());
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI, {}, () =>
  console.log("hlo ppl db ready yoo")
);
const port = process.env.PORT || 9000;
app.get("/", (req, res) => {
  res.send("why u here? nothing to see");
});
app.get("/user-to-discrim", async (req, res) => {
  const { id } = req.query;
  const guildId = process.env.SERVER;
  const guild = client.guilds.cache.get(guildId);
  const users = await guild.members.fetch({ cache: false });
  console.log(users);
  const mems = users.filter((usr) => usr.user.id === id);
  const member = mems.map((ele) => ele.user)[0];
  res.send(member);
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
  commands.create({
    name: "level",
    description: "Check lvl and xp",
  });
  commands.create({
    name: "leaderboard",
    description: "links to web leaderboard",
  });
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }
  const content = message.content;
  let xp = 0;
  const len = content.split("").length;
  if (len < 10 && len >= 1) {
    xp = 2;
  } else if (len < 25 && len >= 11) {
    xp = 8;
  } else if (len < 50 && len >= 26) {
    xp = 14;
  } else if (len > 50) {
    xp = 20;
  }
  let usr = await User.findOne({ idE: message.author.id });
  if (!usr) {
    usr = new User({
      level: 0,
      idE: message.author.id,
      xp: 0,
    });
    usr.save();
    return;
  }
  const pers = pplForFiveMins.filter((user) => user.id === usr.id)[0];
  console.log(pers);
  if (!pers) {
    pplForFiveMins.push({
      id: usr.id,
      xp: xp,
      time: 0,
    });
  } else if (pers && pers.xp > 30) {
    return;
  }
  usr.xp += xp;
  const xpNeeded = lvlToXp(usr.level);
  if (usr.xp >= xpNeeded) {
    usr.xp = usr.xp - xpNeeded;
    console.log(usr.xp);
    usr.level += 1;
    const guildId = process.env.SERVER;
    const guild = client.guilds.cache.get(guildId);
    const channel = client.channels.cache.get("923052826563862589");
    channel.send(
      `Total gg to <@${usr.idE}> for advancing to level ${usr.level}. `
    );

    if (lvl[usr.level]) {
      const role = message.guild.roles.cache.find(
        (r) => r.id == lvl[usr.level]
      );
      const mems = await message.channel.guild.members.fetch({
        cache: false,
      });
      console.log(mems);
      let mem = mems.filter((memb) => {
        console.log(memb.user.id, usr.idE);
        console.log(memb.user.id == usr.idE);
        return memb.user.id == usr.idE;
      });
      mem = mem.map((meme) => meme)[0];
      console.log(mem);
      mem.roles.add(role);
      message.channel.send(
        `Now you have a new role! <@${usr.idE}> is now a  ${role.name}`
      );
    }
  }
  console.log(typeof usr.xp);
  if (pers) {
    pplForFiveMins = pplForFiveMins.map((person) => {
      if (person.id === usr.id) {
        return { ...person, xp: person.xp + xp };
      } else {
        return person;
      }
    });
  }
  usr.save();
  return;
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName, options } = interaction;
  if (commandName === "ping") {
    interaction.reply({ content: "pong", ephemeral: false });
  }
  if (commandName === "level") {
    const person = await User.findOne({ idE: interaction.user.id });
    if (!person) {
      interaction.reply({
        ephemeral: true,
        content:
          "Hi, u need to send a message to gain atleast 2 xp to run this command",
      });
    } else {
      const msgEmb = new MessageEmbed()
        .setTitle("ur level and xp")
        .setDescription(
          `lvl ${person.level} and xp ${person.xp} and needed xp ${lvlToXp(
            person.level
          )}`
        )
        .setURL(
          `https://crickyboi.vercel.app/#/profile/${interaction.user.id}`
        );
      interaction.reply({
        embeds: [msgEmb],
      });
    }
  }
  if (commandName === "leaderboard") {
    const link = `https://crickeyboi.vercel.app/#/server-lb`;
    interaction.reply({ content: link });
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
setInterval(() => {
  pplForFiveMins = pplForFiveMins.map((pers) => ({
    ...pers,
    time: pers.time + 10,
  }));
  pplForFiveMins = pplForFiveMins.filter((pers) => pers.time < 300000);
}, 10);
