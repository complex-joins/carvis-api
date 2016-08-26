'use strict';

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');

var PRIVATE_DIR = path.join(__dirname, '/../../carvis-private-info');
console.log(PRIVATE_DIR);
makePrivateDirsIfNeeded();
var fileDirectory = fs.readdirSync(PRIVATE_DIR);
updatePrivateDirectory(fileDirectory);
fileDirectory = fileDirectory.filter(function (file) {
  return file[0] !== '.';
});
fileDirectory.forEach(function (file) {
  var currentFile = path.join(PRIVATE_DIR, '/' + file);
  var filePath = fs.readFileSync(currentFile).toString().split('\n')[0].replace(/\/\//, '').trim();
  console.log(filePath);
  fs.createReadStream(currentFile).pipe(fs.createWriteStream(path.join(__dirname, '/../' + filePath)));
});

function makePrivateDirsIfNeeded() {
  var searchDir = path.join(__dirname, '/../../');
  var thisDir = path.join(__dirname, '/../');
  if (fs.readdirSync(thisDir).indexOf('secret') === -1) {
    shell.exec('mkdir secret');
  }
  if (fs.readdirSync(searchDir).indexOf('carvis-private-info') === -1) {
    shell.cd('..');
    shell.exec('git clone https://github.com/alexcstark/carvis-private-info.git');
    shell.exec('git remote add upstream https://github.com/alexcstark/carvis-private-info.git');
    shell.cd('carvis-private-info');
  }
}
function updatePrivateDirectory(directory) {
  console.log(directory);
  var pwd = shell.pwd();
  shell.cd('../carvis-private-info');
  shell.exec('git pull origin master');
  shell.cd(pwd);
}