const fs = require("fs");

function LoadDesiredStates() {
  const fileRaw = fs.readFileSync(
    "./desiredStateStore.json",
    (err, data) => {
      if (err) {
        throw err;
      }
    }
  );
  return JSON.parse(fileRaw);
}

function LoadCurrentCDCFile() {
  const fileRaw = fs.readFileSync(
    "./currentQueryData.json",
    (err, data) => {
      if (err) {
        throw err;
      }
    }
  );
  return JSON.parse(fileRaw);
}

function LoadPreviousCDCFile() {
  const fileRaw = fs.readFileSync(
    "./previousQueryData.json",
    (err, data) => {
      if (err) {
        throw err;
      }
    }
  );
  return JSON.parse(fileRaw);
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
  writeCDCFiles
};
