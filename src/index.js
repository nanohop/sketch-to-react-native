require("regenerator-runtime/runtime");

const svgson = require('svgson');
const fs = require('fs');
const path = require('path');

const { emptyAndCreateDir, makeDir, copyFolderRecursive } = require('./lib/files');
const { processNode, imagifyParents } = require('./process');
const { getBrowserBoundingBoxes, screenshotElements } = require('./screenshot');
const { flexBox, flattenBoxComponents } = require('./flex');
const targets = require('./targets');
const { firstBackgroundColor } = require('./attributes');
const { generateChildParent } = require('./components');
const { prepData } = require('./input');
const { removeStatusBarAndKeyboard } = require('./neural_net');
const { 
  aboutZero,
  aboutEqual,
  allAboutEqual,
  smallComparedTo
} = require('./lib/utils');

// catch unhandled rejections (e.g. async/await without try/catch)
process.on("unhandledRejection", function(err) { console.error(err); });

const INPUT_FILE = process.argv[2]
if(!INPUT_FILE || INPUT_FILE == '' || !INPUT_FILE.match(/\.svg$/)) {
  throw "Usage: convert.js [svg_file]"
}

let TARGET = process.argv[3]
if (!TARGET || Object.keys(targets).indexOf(TARGET) <= -1) {
  TARGET = 'react-native';
}

const pathArray = INPUT_FILE.split('/')
const INPUT_FILENAME = pathArray[pathArray.length - 1]

const INPUT_FILE_NO_SPACES = INPUT_FILENAME.replace(/\s/g, '_').split(".svg")[0]
const OUTPUT_FILE = INPUT_FILE_NO_SPACES.split(".svg")[0] + ".js"

const BASE_PATH = path.resolve();
const OUTPUT_DIR = 'output';
const TEMP_DIR = 'temp';
const IMAGES_DIR = INPUT_FILE_NO_SPACES.split(".svg")[0]+'_images';
const TEMP_IMAGES_DIR = path.join(BASE_PATH, TEMP_DIR, IMAGES_DIR);
const TEMP_COMPONENT_DIR = path.join(BASE_PATH, TEMP_DIR, 'components');

makeDir(OUTPUT_DIR); // don't delete what's in output each time!
emptyAndCreateDir(TEMP_DIR);
emptyAndCreateDir(TEMP_IMAGES_DIR);
emptyAndCreateDir(TEMP_COMPONENT_DIR);

(async () => {

  fs.readFile(INPUT_FILE, 'utf-8', (err, data) => {

    const preppedData = prepData({
      data, 
      tempDir: TEMP_DIR, 
      inputFile: INPUT_FILENAME
    });

    svgson(preppedData, {}, async function(result) {

      const processedJS = processNode(result);

      const preppedFile = 'file://'+path.join(BASE_PATH, TEMP_DIR, 'prepped_'+INPUT_FILENAME);

      const cleanedJS = await removeStatusBarAndKeyboard(preppedFile, TEMP_COMPONENT_DIR, processedJS);

      await getBrowserBoundingBoxes(cleanedJS, preppedFile);
      
      const js = imagifyParents(cleanedJS)
      const { idDims, orderedIds } = await getBrowserBoundingBoxes(js, preppedFile);

      const mainBackgroundColor = firstBackgroundColor(js.childs[0], js.childs[0], idDims);

      const childParent = generateChildParent(orderedIds, idDims);

      let parentChildren = {};
      orderedIds.forEach((id) => {
        if(childParent[id]) {
          if(!parentChildren[childParent[id]]) {
            parentChildren[childParent[id]] = [];
          }
          parentChildren[childParent[id]].push(id);
        }
      });
      
      let jsObjs = {}
      const unrollJs = (js) => {
        jsObjs[js.id] = js;
        js.childs.forEach((child) => {
          unrollJs(child)
        })
      }
      unrollJs(js);

      const boxComponents = flexBox([orderedIds[0]], idDims, parentChildren, childParent)

      const flatEles = flattenBoxComponents(boxComponents, boxComponents.id, idDims, jsObjs);

      const polygons = orderedIds.filter((id) => {
        const item = jsObjs[id];
        return(item.type == 'Polygon' || item.type == 'Path' || item.type == 'Image');
      })

      await screenshotElements(
        preppedFile,
        TEMP_IMAGES_DIR,
        polygons
      );

      let globalStyles = {};
      flatEles.forEach((ele) => {
        const js = jsObjs[ele.id];
        if(!ele.end && ele.id != 'row' && ele.id != 'column') {
          const { componentStyles } = targets[TARGET].nativeAttrs(js, ele, idDims, childParent);
          globalStyles = {...globalStyles, ...componentStyles}
        }
      });

      const { imports, componentStrings } = targets[TARGET].generateComponentStrings({
        flatEles, 
        idDims, 
        childParent, 
        jsObjs, 
        imagesDir: IMAGES_DIR
      });

      const generatedComponent = targets[TARGET].generateComponent({
        imports, 
        rootStyle: processedJS.rootStyle, 
        mainBackgroundColor, 
        componentStrings, 
        globalStyles
      })
      emptyAndCreateDir(OUTPUT_DIR + '/' + IMAGES_DIR)
      copyFolderRecursive(TEMP_IMAGES_DIR, OUTPUT_DIR + '/' + IMAGES_DIR)
      fs.writeFileSync(OUTPUT_DIR + '/' + OUTPUT_FILE, generatedComponent)

      console.log("")
      console.log("Images directory written: ", OUTPUT_DIR + '/' + IMAGES_DIR)
      console.log("React Native component generated: ", OUTPUT_DIR + '/' + OUTPUT_FILE)
      console.log("")

    });
  })

})();



