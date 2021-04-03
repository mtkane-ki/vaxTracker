const fs = require("fs"); // library which is responsible for file system actions
const fsSync = require("fs").promises; //library which lets us return a promise on a file system action
const csvParse = require("csv-parse/lib/sync"); //library which lets us synchronously parse csv file data

function LoadDesiredStates() {
  const fileRaw = fs.readFileSync("./desiredStateStore.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
} //pull in the desired state JSON file from disk

function LoadCurrentCDCFile() {
  const fileRaw = fs.readFileSync("./currentQueryData.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
} //pull in the current bot data from disk

async function LoadDownloadedCDCFile(downloadPath) {
  const filePath = `${downloadPath}covid19_vaccinations_in_the_united_states.csv`; //create path variable
  const fileRaw = await fsSync.readFile(filePath, (err, data) => {
    if (err) {
      throw err;
    }
  });// pull in csv data synchronously

  const csvData = csvParse(fileRaw, { columns: true, from_line: 4 }); //parse data into js object
  DeleteFile(filePath); //delete temp file
  return csvData;
} //pull in the csv file, parse it, and delete it

function LoadPreviousCDCFile() {
  const fileRaw = fs.readFileSync("./previousQueryData.json", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(fileRaw);
} //pull in historical bot data

function DeleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
} //delete a given file from disk

function writeCDCFiles(currentData, oldData) {
  fs.writeFileSync(
    "./previousQueryData.json",
    JSON.stringify(oldData, null, 2) //write to file in pretty print
  );
  fs.writeFileSync(
    "./currentQueryData.json",
    JSON.stringify(currentData, null, 2) //write to file in pretty print
  );
} //update bot data files

module.exports = {
  LoadDesiredStates,
  LoadCurrentCDCFile,
  LoadPreviousCDCFile,
  LoadDownloadedCDCFile,
  writeCDCFiles,
};
