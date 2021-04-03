const fs = require("fs");
const fsSync = require("fs").promises;
const csvParse = require("csv-parse/lib/sync");

function LoadDesiredStates() {
  const fileRaw = fs.readFileSync("./desiredStateStore.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
}

function LoadCurrentCDCFile() {
  const fileRaw = fs.readFileSync("./currentQueryData.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
}

async function LoadDownloadedCDCFile() {
  const fileRaw = await fsSync.readFile(
    "./cdcDownloads/covid19_vaccinations_in_the_united_states.csv",
    (err, data) => {
      if (err) {
        throw err;
      }
    }
  );
  const csvData = csvParse(fileRaw, { columns: true, from_line: 4 });
  DeleteFile("f:\\newdocs\\scripts\\repos\\vaxTracker\\vaxTracker\\cdcDownloads\\covid19_vaccinations_in_the_united_states.csv");
  return csvData;
}

function LoadPreviousCDCFile() {
  const fileRaw = fs.readFileSync("./previousQueryData.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
}

function DeleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function writeCDCFiles(currentData, oldData) {
  fs.writeFileSync(
    "./previousQueryData.json",
    JSON.stringify(oldData, null, 2)
  );
  fs.writeFileSync(
    "./currentQueryData.json",
    JSON.stringify(currentData, null, 2)
  );
}

module.exports = {
  LoadDesiredStates,
  LoadCurrentCDCFile,
  LoadPreviousCDCFile,
  LoadDownloadedCDCFile,
  writeCDCFiles,
};
