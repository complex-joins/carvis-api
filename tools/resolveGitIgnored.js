const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const PRIVATE_DIR = path.join(__dirname, '/../../carvis-private-info');
let fileDirectory = fs.readdirSync(PRIVATE_DIR);
updatePrivateDirectory(fileDirectory);
fileDirectory = fileDirectory.filter((file) => file[0] !== '.');
fileDirectory.forEach((file) => {
  let currentFile = path.join(PRIVATE_DIR, `/${file}`);
  let filePath = fs.readFileSync(currentFile)
  .toString()
  .split('\n')[0]
  .replace(/\/\//, '')
  .trim();
  console.log(filePath);
  fs.createReadStream(currentFile).pipe(fs.createWriteStream(path.join(__dirname, `/../${filePath}`)));
});


function updatePrivateDirectory(directory) {
  let pwd = shell.pwd();
  if (directory.length === 0) {
    shell.cd('..');
    shell.exec('git clone https://github.com/alexcstark/carvis-private-info.git');
    shell.cd('carvis-private-info');
  } else {
    shell.cd('../carvis-private-info');
  }
  shell.exec('git pull upstream master');
  shell.cd(pwd);
}
