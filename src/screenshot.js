const puppeteer = require('puppeteer');


const getAllElementIds = (js) => {
  let ids = js.childs.filter((child) => {
    return child.id;
  }).map((child) => {
    return child.id;
  });
  js.childs.forEach((child) => {
    const childIds = getAllElementIds(child);
    ids = [...ids, ...childIds]
  })
  return ids;
}

const screenshotAllElements = (async (file, tempDir, rootJS) => {

  let elements = getAllElementIds(rootJS);

  await screenshotElements(file, tempDir, elements);

})


const screenshotElements = (async (file, tempDir, elementIds) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(file);

  for(let id of elementIds) {
    await screenshotDOMElement(page, id, tempDir)
  }

  browser.close();
});


async function screenshotDOMElement(page, selector, tempDir) {

  const rect = await page.evaluate(selector => {
    const element = document.querySelector("#" + selector);
    if (!element)
      return null;
    const {x, y, width, height} = element.getBoundingClientRect();
    return {left: x, top: y, width, height, id: element.id};
  }, selector);

  if(!rect) {
    throw Error(`Could not find element that matches selector: ${selector}.`);
  }

  return await page.screenshot({
    path: tempDir+'/'+selector+'.png',
    clip: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    }
  });
}


const getEleDimensions = (async (node, page, idDims, orderedIds) => {

  if(node.id) {
    // Get the "viewport" of the page, as reported by the page.
    const dimensions = await page.evaluate((node) => {
      const ele = document.getElementById(node.id) && document.getElementById(node.id).getBoundingClientRect()
      if(ele) {
        return {
          top: Math.min(ele.top, ele.bottom),
          left: Math.min(ele.left, ele.right),
          right: Math.max(ele.right, ele.left),
          bottom: Math.max(ele.bottom, ele.top),
          height: ele.height,
          width: ele.width
        }
      } else {
        return null;
      }
    }, node);

    if(dimensions) {
      idDims[node.id] = dimensions;
      orderedIds.push(node.id);
    }
  }

  for(let child of node.childs) {
    await getEleDimensions(child, page, idDims, orderedIds);
  }

});


const getBrowserBoundingBoxes = (async (js, file) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(file);

  let idDims = {};
  let orderedIds = [];
  await getEleDimensions(js, page, idDims, orderedIds);

  browser.close();

  return({
    idDims,
    orderedIds
  });

});


module.exports.getBrowserBoundingBoxes = getBrowserBoundingBoxes;
module.exports.screenshotElements = screenshotElements;
module.exports.screenshotAllElements = screenshotAllElements;
