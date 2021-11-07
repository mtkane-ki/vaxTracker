const dotenv = require("dotenv").config();
const Discord = require("discord.js"); //library to make discord communication super easy
const cdcQuery = require("./cdcQuery"); //module which is responsible for acquiring and transoforming vaccine data
const fileActions = require("./fileActions"); //module which is responsible for file system actions
const util = require("util"); //needed for deep strict comparision function

const TOKEN = process.env.TOKEN; //access token to initialize websocket with discord
const downloadPath = String.raw`${process.env.DOWNLOADPATH}`; //path where cdc data csv file will be stored temporarily

const bot = new Discord.Client(); //initialize instance of discord client class
const prefix = "!"; //symbol which must prepend a command received by the discord client

function percentage(subset, total) {
  return (subset / total) * 100;
} //calc percentage

bot.login(TOKEN); //log in to discord with client

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
}); //let console user know login successful

//this runs for every message received on any given channel the bot listens on
bot.on("message", async (msg) => {
  if (msg.author.bot) return; //ignore messages bot itself sent
  if (!msg.content.startsWith(prefix)) return; //ignore messages that aren't commands

  const commandBody = msg.content.slice(prefix.length); //remove prefix from command string
  const args = commandBody.split(" "); //split string of command statements into an array
  const command = args.shift().toLowerCase(); //normalize strings

  if (command === "vaxtrack") {
 

    const data = await cdcQuery.getCuratedCDCData(
      (
        await fileActions.LoadDesiredStates()
      ).CDC,
      downloadPath
    ); //trigger download of CDC vaccine csv file, parse, and transform data
    const currentCDCFile = await fileActions.LoadCurrentCDCFile(); //get the vax data on disk we last thought current

    if (!util.isDeepStrictEqual(data, currentCDCFile)) {
      fileActions.writeCDCFiles(data, currentCDCFile); //what we last thought current to previous, write out new data
    } //determine if actually current.

    const previousCDCFile = fileActions.LoadPreviousCDCFile(); //get the vax data on disk we currently know as old

    const vaxEmbed = new Discord.MessageEmbed(); //create instance of new discord embed object
    vaxEmbed.setColor("#0099ff"); //set color of sidebar
    vaxEmbed.setTitle("Current CDC Vaccination Stats"); //set embed title
    const usDelta = data.usTotal - previousCDCFile.usTotal; //calculate vaccine increase for total population
   
    vaxEmbed.addField(
      "Total Completed Courses in US:",
      `${data.usTotal.toLocaleString()} (${data.usPercent.toString()}%) +${usDelta.toLocaleString()}` //pretty print data for display of total pop and percentage of total pop
    ); //add an embed field

    data.stateInfo.forEach((stateInfoItem) => {
      const percent = stateInfoItem.percentPopVaccinated; //get percentage data
      const stateIterator = stateInfoItem.state; //get state name
      const prevStateInfo = previousCDCFile.stateInfo.find(
        (previousState) => previousState.state === stateIterator
      ); //get old state data
      const stateDelta =
        stateInfoItem.totalVaccinated - prevStateInfo.totalVaccinated; //calculate dose increase
      vaxEmbed.addField(
        `${stateInfoItem.state} total completed courses:`,
        `${stateInfoItem.totalVaccinated.toLocaleString()} (${percent.toString()}%) +${stateDelta.toLocaleString()}`
      ); //pretty print data for display of total state data and percentage of state pop
    }); //build embed for each state from desired state store

    msg.reply(vaxEmbed);
  } //end vaxtrack command logic
});
