const dotenv = require("dotenv").config();
const Discord = require("discord.js");
const cdcQuery = require("./cdcQuery");
const fileActions = require("./fileActions");
const censusQuery = require("./censusQuery");
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const util = require("util");

const prefix = "!";

function percentage(subset, total) {
  return (subset / total) * 100;
}

bot.login(TOKEN);

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  const commandBody = msg.content.slice(prefix.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();

  if (
    command === "vaxtrack"
  ) {
    const stateList = fileActions.LoadDesiredStates();
    var popData = await censusQuery.populationQuery(stateList.Census);
    const data = await cdcQuery.getCuratedCDCData(
      (await fileActions.LoadDesiredStates()).CDC
    );
    const currentCDCFile = await fileActions.LoadCurrentCDCFile();

    if (!util.isDeepStrictEqual(data, currentCDCFile)) {
      fileActions.writeCDCFiles(data, currentCDCFile); //this overwrites previousCDCFile on disk.
    }
    const previousCDCFile = fileActions.LoadPreviousCDCFile();

    // console.log(previousCDCFile)
    // console.log(data)
    // console.log(currentCDCFile)

    const vaxEmbed = new Discord.MessageEmbed();
    vaxEmbed.setColor("#0099ff");
    vaxEmbed.setTitle("Current CDC Vaccination Stats");
    const usDelta = data.usTotal - previousCDCFile.usTotal;
    vaxEmbed.addField(
      "Total Completed Courses in US:",
      `${data.usTotal.toLocaleString()} (${percentage(
        data.usTotal,
        popData.totalPopulation
      )
        .toFixed(2)
        .toString()}%) +${usDelta.toLocaleString()}`
    );
    // console.log(data)

    data.stateInfo.forEach((stateInfoItem) => {
      const percent = stateInfoItem.percentPopVaccinated
      const stateIterator = stateInfoItem.state;
      const prevStateInfo = previousCDCFile.stateInfo.find(
        (previousState) => previousState.state === stateIterator
      );
      const stateDelta =
        stateInfoItem.totalVaccinated - prevStateInfo.totalVaccinated;
      vaxEmbed.addField(
        `${stateInfoItem.state} total completed courses:`,
        `${stateInfoItem.totalVaccinated.toLocaleString()} (${percent.toString()}%) +${stateDelta.toLocaleString()}`
      );
    });

    msg.reply(vaxEmbed);
  }
});
