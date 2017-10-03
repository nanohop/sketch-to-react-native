

const processNode = (node, parentAttrs={}) => {
  
  if(node.name == 'svg') {
    return processSVG(node, parentAttrs);
  } else if(node.name == 'g') {
    return processG(node, parentAttrs);
  } else if(node.name == 'text') {
    return processText(node, parentAttrs);
  } else if(node.name == 'rect') {
    return processRect(node, parentAttrs);
  } else if(node.name == 'path') {
    return processPath(node, parentAttrs);
  } else if(node.name == 'polygon') {
    return processPolygon(node, parentAttrs);
  } else if(node.name == 'tspan') {
    return processTspan(node, parentAttrs);
  }
}

const processChildren = (parent, parentAttrs = {}) => {
  const children = parent.childs ? parent.childs : [];

  // If all the nodes are going to be images or empty, 
  // Then just process the entire thing as one image.

  return children.filter((node) => {
    const processedNode = processNode(node, parentAttrs);
    return processedNode;
  }).map((node) => {
    return processNode(node, parentAttrs)
  });
}


const processSVG = (node, parentAttrs={}) => {

  const viewBoxArray = node.attrs.viewBox.split(" ")
  const viewBox = {
    x: viewBoxArray[0],
    y: viewBoxArray[1]
  }
  parentAttrs.viewBox = viewBox;
  
  let rootStyle = {}
  if(node.attrs.style) {
    rootStyle = node.attrs.style.split(/\;\s*/).reduce((r, style) => {
      const keyValue = style.split(/\:\s*/)
      if(keyValue.length == 2) {
        r[keyValue[0]] = keyValue[1]
        if(keyValue[0] == 'background' && keyValue[1].length == 4 || keyValue[1].length == 7) {
          r['backgroundColor'] = keyValue[1]
        }
      }
      return r;
    }, {});
  }

  const backgroundColor = rootStyle && rootStyle.background ? rootStyle.background : rootStyle && rootStyle.backgroundColor ? rootStyle.backgroundColor : '#ffffff';
  let styles = {
    flex: 1,
    alignSelf: 'stretch'
  }
  if(backgroundColor) {
    styles.backgroundColor = backgroundColor
  }

  return {
    id: node.attrs.id,
    type: 'ScrollView',
    rootStyle,
    childs: processChildren(node, parentAttrs),
    style: styles
  }
}

const processPolygon = (node, parentAttrs={}) => {
  return {
    id: node.attrs.id,
    type: 'Polygon',
    childs: [],
    style: {}
  }
}


const processG = (node, parentAttrs={}) => {
  const tl = topLeft(node, parentAttrs)

  let styles = {...tl}

  if(node.attrs.fontSize) {
    parentAttrs.fontSize = node.attrs.fontSize
  }
  if(node.attrs.fontWeight) {
    parentAttrs.fontWeight = node.attrs.fontWeight
  }
  // Font family removed for now

  // if(node.attrs.fontFamily) {
  //   parentAttrs.fontFamily = node.attrs.fontFamily.split(", ")[0]
  // }
  if(node.attrs.lineHeight) {
    parentAttrs.lineHeight = node.attrs.lineSpacing
  }
  if(node.attrs.fill) {
    parentAttrs.fill = node.attrs.fill
  }

  let use = null;
  node.childs && node.childs.forEach((child) => {
    if(child.name == 'use') {
      if(child.attrs.fill) {
        styles.backgroundColor = child.attrs.fill
      }
    }
  })


  return {
    id: node.attrs.id,
    type: 'View',
    childs: processChildren(node, parentAttrs),
    style: styles
  }
}


const processRect = (node, parentAttrs={}) => {
  const tl = topLeft(node, parentAttrs)

  let styles = {...tl}

  const attrs = node.attrs ? node.attrs : {}
  if(attrs.fill) {
    styles.backgroundColor = attrs.fill
  }

  if(attrs.opacity && attrs.fill) {
    const op = parseFloat(attrs.opacity).toFixed(2).split(".")[1];
    styles.backgroundColor = attrs.fill + op
  }

  if(attrs.rx) {
    styles.borderRadius = attrs.rx
  }

  if(attrs.ry) {
    styles.borderRadius = attrs.rx
  }

  return {
    id: node.attrs.id,
    type: 'View',
    childs: processChildren(node, parentAttrs),
    style: styles
  }
}


const processText = (node, parentAttrs={}) => {
  let style = {}
  let text = ""

  const attrs = node.attrs ? node.attrs : {}

  if(attrs.x || attrs.y) {
    style.position =  'absolute'
    style.left = attrs.x ? attrs.x : 0
    style.top = attrs.y ? attrs.y : 0
  }

  style.backgroundColor = 'transparent'
  if(parentAttrs.fontSize) {
    style.fontSize = parentAttrs.fontSize
  }
  if(attrs.fontSize) {
    style.fontSize = attrs.fontSize
  }

  if(parentAttrs.lineHeight) {
    style.lineHeight = parentAttrs.lineHeight
  }
  if(parentAttrs.fontWeight) {
    style.fontWeight = parentAttrs.fontWeight
  }
  if(attrs.fontWeight) {
    style.fontWeight = attrs.fontWeight
  }

  // Font family removed for now; sketch files do not
  // contain the fonts, so this became a mess.

  // if(parentAttrs.fontFamily) {
  //   style.fontFamily = parentAttrs.fontFamily
  // }
  // if(attrs.fontFamily) {
  //   style.fontFamily = attrs.fontFamily.split(", ")[0]
  // }

  if(parentAttrs.fill) {
    style.color = parentAttrs.fill
  }
  if(attrs.fill) {
    style.color = attrs.fill;
  }

  return {
    id: node.attrs.id,
    type: 'Text',
    childs: processChildren(node, parentAttrs),
    text: text,
    style
  }
}


const processTspan = (node, parentAttrs={}) => {
  let style = {}
  const attrs = node.attrs ? node.attrs : {}

  if(attrs.fill) {
    style.color = attrs.fill;
  }
  if(attrs.x || attrs.y) {
    style.position =  'absolute'
    style.left = attrs.x ? attrs.x : 0
    style.top = attrs.y ? attrs.y : 0
  }

  const children = node.childs ? node.childs : [];
  const textChild = children && children.length == 1 && children[0].text ? children[0].text : '';

  return {
    id: node.attrs.id,
    type: 'Tspan',
    childs: [],
    text: textChild,
    style
  }
}



const processPath = (node, parentAttrs={}) => {

  let style = {}
  const attrs = node.attrs ? node.attrs : {}
  let directAttrs = {}

  if(attrs.d) {
    directAttrs.d = attrs.d;
  }

  if(parentAttrs.fill) {
    directAttrs.fill = parentAttrs.fill;
  }
  if(attrs.fill) {
    directAttrs.fill = attrs.fill;
  }
  if(attrs.opacity) {
    directAttrs.opacity = attrs.opacity;
  }
  if(attrs.x || attrs.y) {
    style.position =  'absolute'
    style.left = attrs.x ? attrs.x : 0
    style.top = attrs.y ? attrs.y : 0
  }

  const children = node.childs ? node.childs : [];


  return {
    id: node.attrs.id,
    type: 'Path',
    childs: processChildren(node, parentAttrs),
    style,
    directAttrs: directAttrs
  }
}



const topLeft = (node, parentAttrs={}) => {
  let styles = {position: 'absolute'}
  const viewBox = parentAttrs.viewBox;

  if(node.attrs && node.attrs.transform && node.attrs.transform.match(/^translate\([^\(]+\)$/)) {
    const transform = node.attrs.transform.replace(/^translate\(/, '').replace(/\)$/, '').split(", ")
    styles.left = transform[0] - (viewBox ? viewBox.x : 0)
    styles.top = transform[1] - (viewBox ? viewBox.y : 0)
  }

  if(node.attrs && node.attrs.height) {
    styles.height = node.attrs.height
  }

  if(node.attrs && node.attrs.width) {
    styles.width = node.attrs.width
  }

  if(node.attrs && node.attrs.x) {
    styles.left = node.attrs.x - (viewBox ? viewBox.x : 0)
  }

  if(node.attrs && node.attrs.y) {
    styles.top = node.attrs.y - (viewBox ? viewBox.y : 0)
  }

  return styles
}

// If the bounding boxes for a view are all empty views
// or paths or polygons or masks?
// Then call the view an image, and process it once.
const imagifyParents = (js) => {
  // if all children are empty views or polygons or paths
  // return no children, and change the type to image.

  let newJS = {...js}

  let newChildren = js.childs.map((child) => {
    return imagifyParents(child);
  });

  let siblingsAreImages = js.childs.length > 0
  js.childs.forEach((child) => {
    const emptyView = child.type == 'View' && child.childs.length == 0;
    const isImageType = ['Path', 'Polygon'].indexOf(child.type) > -1;
    if(!emptyView && !isImageType) {
      siblingsAreImages = false
    }
  });

  if(siblingsAreImages) {
    newJS.type = 'Image';
    newJS.childs = [];
  } else {
    newJS.childs = newChildren;
  }

  return newJS;
}


module.exports.processNode = processNode;
module.exports.imagifyParents = imagifyParents;
