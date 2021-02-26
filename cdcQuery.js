const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");


function chunk(array, size) {
    const chunked_arr = [];
    let copied = [...array]; // ES6 destructuring
    const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
    for (let i = 0; i < numOfChild; i++) {
      chunked_arr.push(copied.splice(0, size));
    }
    return chunked_arr;
  };
  
  
  async function getCuratedCDCData(desiredStates) {
    puppeteer.use(stealthPlugin());
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setViewport({ width: 800, height: 600 });
    await page.goto("https://covid.cdc.gov/covid-data-tracker/#vaccinations", {waitUntil: 'networkidle2'});
    
    
    
    await page.evaluate(() => {
      document.querySelector("#vaccinations-table-toggle").click()
    })
    

    await page.waitForFunction(() => {
      return document.querySelectorAll("table tr td").length > 0
    });
    
    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll("table tr td"));    
      return tds.map((td) => td.innerText);
    });
  
   
    const stateSeparateData = await chunk(data, 9);
    
    const stateData = stateSeparateData.map((item) => {
      const stateObj = {
        state: item[0],
        totalVaccinated: Number(item[7]), //change to 7 for 2 doses
      };
      return stateObj;
    });
    
    const statesTotalVax = stateData.map((item) => Number(item.totalVaccinated));
   
    const usTotalVax = statesTotalVax.reduce((total, amount) => total + amount);
      
    const desiredStateData = [];
    for (i = 0; i < desiredStates.length; i++) {
      stateData.forEach((item) => {
        if (item.state === desiredStates[i]) {
          desiredStateData.push(item);
        }
      });
    }
  
    const curatedData = {
      stateInfo: desiredStateData,
      usTotal: Number(usTotalVax)
    }
    browser.close(); 
    return curatedData
  };
  
  module.exports = { getCuratedCDCData };