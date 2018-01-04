
const {
  aboutZero,
  aboutCentered,
  aboutEqual
} = require('../lib/utils');

function nativeAttrs(js, ele, idDims, childParent) {
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

  let jsStyles = { ...rest }

  if (width < 360) {
    jsStyles.width = width;
  }

  // Note: 360 is the max width of iphone
  if (js.type == 'View' && !jsStyles.width && dims.width < 360) {
    jsStyles.width = dims.width;
  }

  if (js.type == 'Text' || js.type == 'Tspan') {
    const parent = childParent[js.id];
    const parentDims = parent && idDims[parent];
    if (parentDims) {
      const spaceBefore = dims.left - parentDims.left;
      const spaceAfter = parentDims.right - dims.right;

      if (aboutCentered(spaceBefore, spaceAfter) && !aboutZero(spaceBefore)) {
        jsStyles['textAlign'] = 'center';
      }

      if (!aboutCentered(spaceBefore, spaceAfter) && spaceBefore < spaceAfter) {
        jsStyles['textAlign'] = 'left';
        jsStyles['marginLeft'] = spaceBefore;
      }

      if (!aboutCentered(spaceBefore, spaceAfter) && spaceBefore > spaceAfter) {
        jsStyles['textAlign'] = 'right';
        jsStyles['marginRight'] = spaceAfter;
      }

    }
  }


  const parent = childParent[ele.id]
  if (parent) {
    const parentDims = parent == 'row' || parent == 'column' ? parent.parentDims : idDims[parent]
    if (js.type == 'View' && !jsStyles.height && !aboutEqual(dims.height, parentDims.height)) {
      jsStyles.height = dims.height;
    }
  }

  let styles = jsStyles ? Object.keys(jsStyles).reduce((r, key) => {
    if (key == 'top' ||
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
      if (jsStyles[key] > 0) {
        r[key] = Math.round(jsStyles[key])
      }
    } else {
      r[key] = `'${jsStyles[key]}'`
    }
    return r;
  }, {}) : {};


  if (ele.alignJustify) {
    Object.keys(ele.alignJustify).forEach((key) => {
      if (key == 'paddingTop' ||
        key == 'paddingBottom' ||
        key == 'paddingRight' ||
        key == 'paddingLeft' ||
        key == 'marginTop' ||
        key == 'marginBottom' ||
        key == 'marginLeft' ||
        key == 'marginRight') {
        if (ele.alignJustify[key] > 0) {
          styles[key] = Math.round(ele.alignJustify[key]);
        }
      } else {
        styles[key] = `'${ele.alignJustify[key]}'`
      }
    })
  }


  let attrObjs = {}

  if (js.directAttrs) {
    Object.keys(js.directAttrs).forEach((key) => {
      attrObjs[key] = "'" + js.directAttrs[key] + "'"
    })
  }

  const attrString = Object.keys(attrObjs).map((key) => {
    return `${key}={${attrObjs[key]}}`
  }).join(" ");

  const attrs = attrString.length > 0 ? " " + attrString : "";
  let styleId = js.id.replace(/[^\_0-9a-zA-Z]/g, '')
  if (styleId.match(/^[0-9]/)) {
    styleId = "_" + styleId
  }

  componentStyles[styleId] = styles;
  return ({ attrs, attrObjs, styleId, componentStyles });
}

// Note: the spacing (indentation) is important (even though it looks weird)
// for everything in the ``.
const generateStyleSheetString = (componentStyles) => {
  return Object.keys(componentStyles).map((key) => {
    const keyStyles = Object.keys(componentStyles[key]).map((styleKey) => {
      const styleString = componentStyles[key][styleKey]
      return `    ${styleKey}: ${styleString}`
    }).join(",\n");
    return `  ${key}: {
${keyStyles}
  }`
  }).join(",\n")
}


const generateComponentStrings = ({
  flatEles,
  idDims,
  childParent,
  jsObjs,
  imagesDir
}) => {
  let imports = [];

  const componentStrings = flatEles.map((ele) => {

    const color = '#' + '0123456789abcddd'.split('').map(function (v, i, a) { return i > 5 ? null : a[Math.floor(Math.random() * 16)] }).join('');

    if (ele.end) {
      if (ele.id == 'row') return `${ele.spaces}</View>`
      if (ele.id == 'column') return `${ele.spaces}</View>`
      // The rest of the ends are covered below
    }

    if (ele.id == 'row') {
      let styleAttrs = [`flexDirection: 'row'`]
      if (ele.alignJustify) {
        const aj = ele.alignJustify
        if (aj.justifyContent) styleAttrs.push(`justifyContent: '${aj.justifyContent}'`)
        if (aj.alignItems) styleAttrs.push(`alignItems: '${aj.alignItems}'`)
        if (aj.marginRight) styleAttrs.push(`marginRight: '${aj.marginRight}'`)
        if (aj.marginLeft) styleAttrs.push(`marginLeft: '${aj.marginLeft}'`)
        if (aj.marginTop) styleAttrs.push(`marginTop: '${aj.marginTop}'`)
        if (aj.marginBottom) styleAttrs.push(`marginBottom: '${aj.marginBottom}'`)
      }
      return `${ele.spaces}<View style={{${styleAttrs.join(", ")}}}${ele.single ? ' /' : ''}>`
    }
    if (ele.id == 'column') {
      return `${ele.spaces}<View style={{flexDirection: 'column'}}${ele.single ? ' /' : ''}>`
    }

    const js = jsObjs[ele.id];

    if (ele.end) {
      if (js.type == 'Path') return `${ele.spaces}</Image>`
      if (js.type == 'Image') return `${ele.spaces}</Image>`
      if (js.type == 'Polygon') return `${ele.spaces}</Image>`
      return `${ele.spaces}</View>`
    }

    const { attrs, attrObjs, styleId } = nativeAttrs(js, ele, idDims, childParent);

    const styles = styleId ? ` style={styles.${styleId}}` : ''

    if (js.type == 'Text') {
      if (js.childs.length == 0) {
        return `${ele.spaces}<Text${attrs}${styles}>${js.text}${ele.single ? '</Text>' : ''}`
      }
      if (js.childs.length == 1 && js.childs[0].type == 'Tspan') {
        return `${ele.spaces}<Text${attrs}${styles}>${js.text}${js.childs[0].text}</Text>`
      } else {
        const tspans = js.childs.map((t) => {
          if (t.type == 'Tspan') {
            // TODO: once tspans have ids, change this
            // const {Tattrs, TattrObjs, TstyleId} = attrs(t, ele);
            // const Tstyles = TstyleId ? ` style={styles.${styleId}}` : ''
            const Tstyles = ''
            return `${ele.spaces}  <Text${Tstyles}>${t.text}</Text>{'\\n'}`
          }
        }).join("\n")

        return `${ele.spaces}<Text${attrs}${styles}>${js.text}\n${tspans}\n${ele.spaces}</Text>`
      }

    }
    if (js.type == 'Tspan') {
      return `<Text${styles}>${js.text}</Text>`
    }

    if (js.type == 'Polygon') {
      const imageStyle = attrObjs.style ? ` style={${attrObjs.style}}` : '';
      const jsname = js.id.replace("-", "").replace("+", "")
      if (imports.indexOf(`import ${jsname} from './${imagesDir}/${js.id}.png'`) < 0) {
        imports.push(`import ${jsname} from './${imagesDir}/${js.id}.png'`)
      }
      return `${ele.spaces}<Image source={${jsname}}${imageStyle}${styles} />`
    }

    if (js.type == 'Image') {
      const imageStyle = attrObjs.style ? ` style={${attrObjs.style}}` : '';
      const jsname = js.id.replace("-", "").replace("+", "")
      if (imports.indexOf(`import ${jsname} from './${imagesDir}/${js.id}.png'`) < 0) {
        imports.push(`import ${jsname} from './${imagesDir}/${js.id}.png'`)
      }
      return `${ele.spaces}<Image source={${jsname}}${imageStyle}${styles} />`
    }

    if (js.type == 'Path') {
      const imageStyle = attrObjs.style ? ` style={${attrObjs.style}}` : '';
      if (ele.end) {
        return `${ele.spaces}</Image>`
      }
      const jsname = js.id.replace("-", "").replace("+", "")
      if (imports.indexOf(`import ${jsname} from './${imagesDir}/${js.id}.png'`) < 0) {
        imports.push(`import ${jsname} from './${imagesDir}/${js.id}.png'`)
      }
      if (ele.single) {
        return `${ele.spaces}<Image source={${jsname}}${imageStyle}${styles} />`
      } else {
        return `${ele.spaces}<Image source={${jsname}}${imageStyle}${styles}>`
      }
    }

    if (ele.end) {
      return (ele.spaces + '</View>');
    }
    return `${ele.spaces}<${js.type}${attrs}${styles}${ele.single ? ' /' : ''}>`

  }).join("\n");

  return ({
    componentStrings,
    imports
  })
}



const generateComponent = ({
  imports,
  rootStyle,
  mainBackgroundColor,
  componentStrings,
  globalStyles
}) => {
  const styleSheetString = generateStyleSheetString(globalStyles);

  // Note: the spacing (indentation) is important (even though it looks weird)
  // for everything in the ``.
  return (
    `import React, { Component } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image
} from 'react-native';

`+ imports.join("\n") + `

export default class Main extends Component {

  render() {
    return (
      <ScrollView style={{
        flex: 1, alignSelf: 'stretch', 
        paddingTop: 20,
        backgroundColor: '${rootStyle && rootStyle.backgroundColor ? rootStyle.backgroundColor : mainBackgroundColor ? mainBackgroundColor : '#ffffff'}'}}>
` + componentStrings + `
      </ScrollView>
    )
  }

}

const styles = StyleSheet.create({
${styleSheetString}
})
`
  )
}

module.exports.name = 'React Native';
module.exports.nativeAttrs = nativeAttrs;
module.exports.generateComponent = generateComponent;
module.exports.generateComponentStrings = generateComponentStrings;
