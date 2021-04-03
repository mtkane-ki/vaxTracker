const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const fileActions = require("./fileActions.js");

async function getCuratedCDCData(desiredStates, downloadPath) {
  puppeteer.use(stealthPlugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({ width: 800, height: 600 });
  await page.goto("https://covid.cdc.gov/covid-data-tracker/#vaccinations", {
    waitUntil: "networkidle2",
  });

  await page.evaluate(() => {
    document.querySelector("#vaccinations-table-toggle").click();
  });

  const client = await page.target().createCDPSession();

  client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await page.evaluate(() => {
    document.getElementById("btnVaccinationsExport").click();
  });

  await page.waitForTimeout(2000);

  const cdcData = await fileActions.LoadDownloadedCDCFile(downloadPath);

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
    usTotal: Number(usTotalVax),
  };
  browser.close();

  return curatedData;
}

module.exports = { getCuratedCDCData };
