const svgson = require('svgson');
const fs = require('fs');

const { emptyAndCreateDir, makeDir, copyFolderRecursive } = require('./src/lib/files');
const { processNode, imagifyParents } = require('./src/process');
const { getBrowserBoundingBoxes, screenshotElements } = require('./src/screenshot');
const { flexBox, flattenBoxComponents } = require('./src/flex');
const { generateComponent, generateComponentStrings } = require('./src/output');
const { firstBackgroundColor, nativeAttrs } = require('./src/attributes');
const { generateChildParent } = require('./src/components');
const { prepData } = require('./src/input');
const { 
  aboutZero,
  aboutEqual,
  allAboutEqual,
  smallComparedTo
} = require('./src/lib/utils');


const CURRENT_DIR = __dirname
const INPUT_FILE = process.argv[2]
if(!INPUT_FILE || INPUT_FILE == '' || !INPUT_FILE.match(/\.svg$/)) {
  throw "Usage: convert.js [svg_file]"
}
const INPUT_FILE_NO_SPACES = INPUT_FILE.replace(/\s/g, '_')

const OUTPUT_FILE = INPUT_FILE_NO_SPACES.split(".svg")[0] + ".js"

const OUTPUT_DIR = './output'
const TEMP_DIR = './temp'
const IMAGES_DIR = INPUT_FILE_NO_SPACES.split(".svg")[0]+'_images'
const TEMP_IMAGES_DIR = './temp/'+IMAGES_DIR

makeDir(OUTPUT_DIR); // don't delete what's in output each time!
emptyAndCreateDir(TEMP_DIR);
emptyAndCreateDir(TEMP_IMAGES_DIR);


(async () => {

  fs.readFile(INPUT_FILE, 'utf-8', (err, data) => {

    const preppedData = prepData({
      data, 
      tempDir: TEMP_DIR, 
      inputFile: INPUT_FILE
    });

    svgson(preppedData, {}, async function(result) {

      const processedJS = processNode(result);

      const preppedFile = 'file://'+CURRENT_DIR+'/temp/prepped_'+INPUT_FILE;

      await getBrowserBoundingBoxes(processedJS, preppedFile);
      
      const js = imagifyParents(processedJS)
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
          const { componentStyles } = nativeAttrs(js, ele, idDims, childParent);
          globalStyles = {...globalStyles, ...componentStyles}
        }
      });

      const { imports, componentStrings } = generateComponentStrings({
        flatEles, 
        idDims, 
        childParent, 
        jsObjs, 
        imagesDir: IMAGES_DIR
      });

      const generatedComponent = generateComponent({
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



