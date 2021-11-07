const puppeteer = require("puppeteer-extra"); //module which is responsible for scraping data with chromium engine
const stealthPlugin = require("puppeteer-extra-plugin-stealth"); //module which is responsible for keeping scraping secret
const fileActions = require("./fileActions.js"); //module which is responsible for file system actions

async function getCuratedCDCData(desiredStates, downloadPath) {
  
  puppeteer.use(stealthPlugin()); //tell puppeteer to use the stealth plugin

  const browser = await puppeteer.launch({ headless: true }); //launch browser non-interactively
  const page = await browser.newPage(); //open a new tab
  page.setViewport({ width: 800, height: 600 }); //set viewport for headed mode

  await page.goto("https://covid.cdc.gov/covid-data-tracker/#vaccinations", {
    waitUntil: "networkidle2",
  }); //navigate to page and wait for it to finish loading

  await page.evaluate(() => {
    document.querySelector("#vaccinations-table-toggle").click();
  }); //expand the table our button is hidden inside of

  const client = await page.target().createCDPSession(); //create client session object for chromium dev tools protocol

  client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  }); //use chromium dev tools protocol client to tell chromium how to handle the file download

  await page.evaluate(() => {
    document.getElementById("btnVaccinationsExport").click();
  }); //push the button

  await page.waitForTimeout(2000); //wait for 2 secs to ensure chromium finishes downloading

  const cdcData = await fileActions.LoadDownloadedCDCFile(downloadPath); //ingest downloaded file, parse data, remove from disk

  const stateData = cdcData.map((item) => {
    const stateObj = {
      state: item["State/Territory/Federal Entity"],
      totalVaccinated: Number(
        item["People Fully Vaccinated by State of Residence"]
      ),
      percentPopVaccinated: Number(
        item["Percent of Total Pop Fully Vaccinated by State of Residence"]
      ),
    };
    return stateObj;
  }); //package raw state data

  const statesTotalVax = stateData.map((item) => Number(item.totalVaccinated)); //convert vax data from string to number type

  // const usTotalVax = statesTotalVax.reduce((total, amount) => total + amount); // aggregate states vax numbers to US total

  const desiredStateData = []; //empty array to hold desired state data

  const usTotalVax = stateData.filter(item => {
    return item.state === "United States"
  })
  // console.log(usTotalVax)


  for (i = 0; i < desiredStates.length; i++) {
    stateData.forEach((item) => {
      if (item.state === desiredStates[i]) {
        desiredStateData.push(item);
      }     
    });
  } //load desired state data array

  const curatedData = {
    stateInfo: desiredStateData,
    usTotal: Number(usTotalVax[0].totalVaccinated),
    usPercent: Number(usTotalVax[0].percentPopVaccinated)
  }; //package data

  await browser.close(); //close chromium

  return curatedData; //send it
} //end fetch and transform logic

module.exports = { getCuratedCDCData };
