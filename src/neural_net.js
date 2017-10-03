
const exec = require('child_process').exec;

const { screenshotAllElements } = require('./screenshot');



const filterElements = (js) => {
  if(js.childs) {
    const newChildren = js.childs.filter((child) => {
      if(child.id == 'Bars/Status/White') {
        return false;
      } else {
        filterElements(child);
        return true;
      }
    });
    js.childs = newChildren
  }
  return js;
}

const removeStatusBarAndKeyboard = (async (file, tempDir, js) => {
  // Start with the children
  await screenshotAllElements(file, tempDir, js)


  return filterElements(js)
})



module.exports.removeStatusBarAndKeyboard = removeStatusBarAndKeyboard;
