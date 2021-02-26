
const dotenv = require("dotenv").config();
const axios = require('axios');
const fileActions = require ('./fileActions');

const censusKey = process.env.CENSUSKEY
const apiURL = "http://api.census.gov"



function extractState(data,state) {
    const states = data.find(element => {
        const selectedArray = element.find(stateArr => stateArr === state )  
        if(selectedArray){
            return element
        }
     });
     return states
}

async function populationQuery(stateList) {
    const getInstance = axios.create({
      baseURL: `${apiURL}`,
      timeout: 5000,      
    });
   
    const res = await getInstance.get(`data/2019/pep/population?get=NAME,POP,STATE&for=state:*&key=${censusKey}`)
    
    const states = stateList.map(state => extractState(res.data,state))
    const removeNonStatePop = res.data.filter(population => population[1] !== "POP")
    const allPops = removeNonStatePop.map(population => Number(population[1]))        
    const totalPop = allPops.reduce((total, amount) => total + amount)
    
    const statePopMap = new Map()
    states.forEach(function(state) {
        if (state[0] === "New York") {
            statePopMap.set(`${state[0]} State`,state[1]);
        }
        else{
            statePopMap.set(state[0],state[1]);
        }

    });
    const popObj = {
        statePops: statePopMap ,
        totalPopulation: totalPop
    };
    return popObj
}



module.exports = {populationQuery}