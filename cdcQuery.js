const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const fileActions = require("./fileActions.js");

function chunk(array, size) {
  const chunked_arr = [];
  let copied = [...array]; // ES6 destructuring
  const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
  for (let i = 0; i < numOfChild; i++) {
    chunked_arr.push(copied.splice(0, size));
  }
  return chunked_arr;
}

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

  //id="btnVaccinationsExport"

  // const button = await page.waitForFunction( () => {
  //     return document.getElementById("btnVaccinationsExport")
  //   })

  const client = await page.target().createCDPSession();

  client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await page.evaluate(() => {
    document.getElementById("btnVaccinationsExport").click();
  });

  await page.waitForTimeout(2000);
  // await page.waitForFunction(() => {
  //   return document.querySelectorAll("table tr td").length > 0;
  // });

  // const data = await page.evaluate(() => {
  //   const tds = Array.from(document.querySelectorAll("table tr td"));
  //   return tds.map((td) => td.innerText);
  // });

  const cdcData = await fileActions.LoadDownloadedCDCFile(downloadPath);

  // const stateSeparateData = await chunk(data, 5);

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

  // console.log(stateSeparateData)
  // const stateData = stateSeparateData.map((item) => {
  //   const stateObj = {
  //     state: item[0],
  //     totalVaccinated: Number(item[1]), //changing for total doses
  //   };
  //   return stateObj;
  // });

  // console.log(stateData)

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

// debug

//

module.exports = { getCuratedCDCData };
