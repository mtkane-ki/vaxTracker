const axios = require("axios"); //library which is responsible http(s) requests
const fileActions = require("./fileActions"); //module which is responsible for file system actions


const apiURL = "http://api.census.gov"; //api endpoint

async function populationQuery(censusKey) {
  const getInstance = axios.create({
    baseURL: `${apiURL}`,
    timeout: 5000,
  }); //build request callback

  const res = await getInstance.get(
    `data/2019/pep/population?get=NAME,POP,STATE&for=state:*&key=${censusKey}`
  ); //authenticate and wait for data to return

  const removeNonStatePop = res.data.filter(
    (population) => population[1] !== "POP"
  ); //clean out bad data fields

  const allPops = removeNonStatePop.map((population) => Number(population[1])); //build object of every state to its population
  const totalPop = allPops.reduce((total, amount) => total + amount); //aggregate state populations to get total US population

  const popObj = {
    totalPopulation: totalPop,
  }; //package data
  return popObj; //send it
}

module.exports = { populationQuery };
