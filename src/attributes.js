
const { 
  aboutZero,
  aboutCentered,
  aboutEqual,
  allAboutEqual,
  smallComparedTo
} = require('./lib/utils');


const nativeAttrs = (js, ele, idDims, childParent) => {
  const dims = idDims[js.id] ? idDims[js.id] : {};
  let componentStyles = {};

  const {
    top,
    left,
    width,
    // height,
    position,
    ...rest
  } = js.style

  let jsStyles = {...rest}

  if(width < 360) {
    jsStyles.width = width;
  }

  // Note: 360 is the max width of iphone
  if(js.type == 'View' && !jsStyles.width && dims.width < 360) {
    jsStyles.width = dims.width;
  }

  if(js.type == 'Text' || js.type == 'Tspan') {
    const parent = childParent[js.id];
    const parentDims = parent && idDims[parent];
    if(parentDims) {
      const spaceBefore = dims.left - parentDims.left;
      const spaceAfter = parentDims.right - dims.right;

      if(aboutCentered(spaceBefore, spaceAfter) && !aboutZero(spaceBefore)) {
        jsStyles['textAlign'] = 'center';
      }

      if(!aboutCentered(spaceBefore, spaceAfter) && spaceBefore < spaceAfter) {
        jsStyles['textAlign'] = 'left';
        jsStyles['marginLeft'] = spaceBefore;
      }

      if(!aboutCentered(spaceBefore, spaceAfter) && spaceBefore > spaceAfter) {
        jsStyles['textAlign'] = 'right';
        jsStyles['marginRight'] = spaceAfter;
      }

    }
  }


  const parent = childParent[ele.id]
  if(parent) {
    const parentDims = parent == 'row' || parent == 'column' ? parent.parentDims : idDims[parent]
    if(js.type == 'View' && !jsStyles.height && !aboutEqual(dims.height, parentDims.height)) {
      jsStyles.height = dims.height;
    }
  }

  let styles = jsStyles ? Object.keys(jsStyles).reduce((r, key) => {
    if(key == 'top' || 
      key == 'left' ||
      key == 'flex' || 
      key == 'height' || 
      key == 'width' ||
      key == 'fontSize' ||
      key == 'lineHeight' ||
      key == 'borderRadius' || 
      key == 'paddingTop' || 
      key == 'paddingBottom' ||
      key == 'paddingRight' ||
      key == 'paddingLeft' ||
      key == 'marginTop' ||
      key == 'marginBottom' ||
      key == 'marginLeft' ||
      key == 'marginRight') {
      if(jsStyles[key] > 0) {
        r[key] = Math.round(jsStyles[key])        
      }
    } else {
      r[key] = `'${jsStyles[key]}'`      
    }
    return r;
  }, {}) : {};


  if(ele.alignJustify) {
    Object.keys(ele.alignJustify).forEach((key) => {
      if(key == 'paddingTop' || 
        key == 'paddingBottom' ||
        key == 'paddingRight' ||
        key == 'paddingLeft' ||
        key == 'marginTop' ||
        key == 'marginBottom' ||
        key == 'marginLeft' || 
        key == 'marginRight') {
        if(ele.alignJustify[key] > 0) {
          styles[key] = Math.round(ele.alignJustify[key]);          
        }
      } else {
        styles[key] = `'${ele.alignJustify[key]}'`
      }
    })
  }


  let attrObjs = {}

  if(js.directAttrs) {
    Object.keys(js.directAttrs).forEach((key) => {
      attrObjs[key] = "'" + js.directAttrs[key] + "'"
    })
  }

  const attrString = Object.keys(attrObjs).map((key) => {
    return `${key}={${attrObjs[key]}}`
  }).join(" ");

  const attrs = attrString.length > 0 ? " " + attrString : "";
  let styleId = js.id.replace(/[^\_0-9a-zA-Z]/g, '')
  if(styleId.match(/^[0-9]/)) {
    styleId = "_" + styleId
  }

  componentStyles[styleId] = styles;
  return({attrs, attrObjs, styleId, componentStyles});
}

const firstBackgroundColor = (js, base, idDims) => {
  const rDims = idDims[base.id]
  const jsDims = idDims[js.id]
  let backgroundColor = null;
  if(rDims && jsDims && rDims.top == jsDims.top && rDims.bottom == jsDims.bottom && rDims.left == jsDims.left && rDims.right == jsDims.right) {
    if(js.style.backgroundColor) {
      backgroundColor = js.style.backgroundColor;
    }
  }
  js.childs.forEach((child) => {
    const childColor = firstBackgroundColor(child, base, idDims);
    if(childColor) {
      backgroundColor = childColor;
    }
  });
  return backgroundColor;
}


const determineAlignJustify = (comp, children, idDims, jsObjs) => {
  let alignJustify = {}

  if(comp.id == 'row' && children && children.length > 0) {
    const spaceBefore = idDims[children[0].id].left - comp.parentDims.left;
    const spaceAfter = comp.parentDims.right - idDims[children[children.length - 1].id].right;
    let spacesBetween = [];

    children.forEach((child, index) => {
      if(index > 0) {
        spacesBetween.push(idDims[children[index].id].left - idDims[children[index - 1].id].right)
      }
    });

    if(spacesBetween.length > 0 && allAboutEqual(spacesBetween)) {
      // space between case
      if(aboutEqual(spaceBefore, spaceAfter)) {
        if(smallComparedTo(spaceBefore, spacesBetween[0])) {
          alignJustify['justifyContent'] = 'space-between'
        }
      }
      // space around case
      if(aboutEqual(spaceBefore, spaceAfter) && !aboutZero(spaceBefore)) {
        alignJustify['justifyContent'] = 'space-around'
      }
    }

  } else if(comp.id == 'column') {

  } else {
    if(children.id) {
      // One child
      const childDims = children.id == 'row' || children.id == 'column' ? children.parentDims : idDims[children.id];
      const parentDims = comp.id == 'row' || children.id == 'column' ? comp.parentDims : idDims[comp.id];

      const spaceBefore = childDims.left - parentDims.left;
      const spaceAfter = parentDims.right - childDims.right;
      const spaceAbove = childDims.top - parentDims.top;
      const spaceBelow = parentDims.bottom - childDims.bottom;

      if(aboutEqual(spaceBefore, spaceAfter)) {
        alignJustify['alignItems'] = 'center'
      } else if(spaceBefore > spaceAfter) {
        alignJustify['alignItems'] = 'flex-end'
        alignJustify['marginRight'] = spaceAfter
      } else if(spaceBefore < spaceAfter) {
        alignJustify['alignItems'] = 'flex-start'
        alignJustify['marginLeft'] = spaceBefore
      }

      if(aboutEqual(spaceAbove, spaceBelow)) {
        alignJustify['justifyContent'] = 'center'
      } else if(spaceAbove > spaceBelow) {
        alignJustify['justifyContent'] = 'flex-end'              
        alignJustify['marginBottom'] = spaceBelow             
      } else if(spaceAbove < spaceBelow) {
        alignJustify['justifyContent'] = 'flex-start'              
        alignJustify['marginTop'] = spaceAbove              
      }

    } else {
      // Multiple Children; default to column

      const firstChildDims = children[0].id == 'row' || children[0].id == 'column' ? children[0].parentDims : idDims[children[0].id]
      const lastChildDims = children[children.length - 1].id == 'row' || children[children.length - 1].id == 'column' ? children[children.length - 1].parentDims : idDims[children[children.length - 1].id]
      const parentDims = comp.id == 'row' || children.id == 'column' ? comp.parentDims : idDims[comp.id];

      const spaceAbove = firstChildDims.top - parentDims.top;
      const spaceBelow = parentDims.bottom - lastChildDims.bottom;

      let spacesBetween = [];
      children.forEach((child, index) => {
        const childJS = jsObjs[child.id];
        const childDims = child.id == 'row' || child.id == 'column' ? child.parentDims : idDims[child.id]

        if(child.id != 'row' && child.id != 'column') {
          const spaceBefore = childDims.left - parentDims.left;
          const spaceAfter = parentDims.right - childDims.right;
          if(aboutEqual(spaceBefore, spaceAfter)) {
            childJS.style['alignSelf'] = 'center';
          } else if(spaceBefore > spaceAfter) {
            childJS.style['alignSelf'] = 'flex-end';
            childJS.style['marginRight'] = spaceAfter;
          } else if(spaceBefore < spaceAfter) {
            childJS.style['alignSelf'] = 'flex-start';
            childJS.style['marginLeft'] = spaceBefore;
          }

        }

        if(index > 0) {
          const lastChildDims = children[index - 1].id == 'row' || children[index - 1].id == 'column' ? children[index - 1].parentDims : idDims[children[index - 1].id]
          spacesBetween.push(childDims.top - lastChildDims.bottom)
          if(childJS) {
            childJS.style['marginTop'] = childDims.top - lastChildDims.bottom;                  
          }
        }
      });

      if(!aboutEqual(spaceBelow, spaceAbove)) {
        // apply padding
        alignJustify['paddingTop'] = spaceAbove;
        alignJustify['paddingBottom'] = spaceBelow;
      }

    }
  }

  return alignJustify;
}


module.exports.nativeAttrs = nativeAttrs;
module.exports.determineAlignJustify = determineAlignJustify;
module.exports.firstBackgroundColor = firstBackgroundColor;
