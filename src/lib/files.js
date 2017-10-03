const fs = require('fs');

// Clear the images directory
const deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

module.exports.makeDir = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

module.exports.emptyAndCreateDir = (dir) => {
  deleteFolderRecursive(dir);
  fs.mkdirSync(dir);
}

module.exports.copyFolderRecursive = function(path, toPath) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      const curPath = path + "/" + file;
      const newPath = toPath + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        copyFolderRecursive(curPath);
      } else { // delete file
        fs.createReadStream(curPath).pipe(fs.createWriteStream(newPath));
      }
    });
  }
};

