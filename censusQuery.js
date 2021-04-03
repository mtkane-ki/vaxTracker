const dotenv = require("dotenv").config();
const axios = require("axios");
const fileActions = require("./fileActions");

const censusKey = process.env.CENSUSKEY;
const apiURL = "http://api.census.gov";

async function populationQuery() {
  const getInstance = axios.create({
    baseURL: `${apiURL}`,
    timeout: 5000,
  });

  const res = await getInstance.get(
    `data/2019/pep/population?get=NAME,POP,STATE&for=state:*&key=${censusKey}`
  );

  const removeNonStatePop = res.data.filter(
    (population) => population[1] !== "POP"
  );
  const allPops = removeNonStatePop.map((population) => Number(population[1]));
  const totalPop = allPops.reduce((total, amount) => total + amount);

  const popObj = {
    totalPopulation: totalPop,
  };
  return popObj;
}

module.exports = { populationQuery };
