
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const { screenshotAllElements } = require('./screenshot');


const childIsBadElement = (async (child, tempDir) => {
  if(!child.id || child.id == '') {
    return false
  }

  const filepath = path.join(tempDir, 'components/'+child.id+'.png');
  if (!fs.existsSync(filepath)) {
    return false;
  }

  const command = `python -m ${path.join(__dirname, '../scripts/label_image')} --graph=${path.join(__dirname, '../tf_files/retrained_graph.pb')} --image=`+filepath;

  return new Promise((resolve, reject) => {
    exec(command, 
      function (error, stdout, stderr) {
        if(stdout && stdout != '') {
          const results = stdout.split("\n")

          const statusBar = results.filter((result) => {
            return result.match(/^status\sbar/);
          });
          const isStatusBar = statusBar && statusBar.length > 0 && parseFloat(statusBar[0].split(/\s/)[statusBar[0].split(/\s/).length - 1]);

          const keyboard = results.filter((result) => {
            return result.match(/^keyboard/);
          });
          const isKeyboard = keyboard && keyboard.length > 0 && parseFloat(keyboard[0].split(/\s/)[keyboard[0].split(/\s/).length - 1]);

          // Make sure you're really sure it's a status bar or keyboard
          // just text can trigger even a 98% status bar response
          resolve(isStatusBar > 0.99 || isKeyboard > 0.99)
        }

        if (error !== null) {
          console.log('exec error: ' + error);
          resolve(false)
        } else {
          resolve(false)
        }
    });
  });

});


const filterElements = (async (js, tempDir) => {
  if(js.childs) {

    const newChildren = await Promise.all(js.childs.map(async (child) => {
      const childShouldBeFilteredOut = await childIsBadElement(child, tempDir);
      if(childShouldBeFilteredOut) {
        return null;
      } else {
        await filterElements(child, tempDir);
        return child
      }
    }));

    const filteredChildren = newChildren.filter(child => child);
    js.childs = filteredChildren
  }
  return js;
})

const removeStatusBarAndKeyboard = (async (file, tempDir, js) => {
  // Start with the children
  await screenshotAllElements(file, tempDir, js)
  console.warn("filtering elements...")
  const newJS = await filterElements(js, tempDir)

  return newJS;
})



module.exports.removeStatusBarAndKeyboard = removeStatusBarAndKeyboard;
