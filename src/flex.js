
const { determineAlignJustify } = require('./attributes');



const flexColumns = (nodeIds, idDims, parentChildren, childParent) => {
  if(nodeIds.length == 0) {
    return nodeIds
  }

  const orderedNodeIds = nodeIds.sort((a, b) => {
    const adims = idDims[a];
    const bdims = idDims[b];

    if(adims.left == bdims.left) {
      return adims.top - bdims.top;
    }

    return adims.left - bdims.left
  });

  let colBreaks = [0];
  let currentRight = null;

  orderedNodeIds.forEach((nodeId, i) => {
    const node = idDims[nodeId];
    if(!currentRight) {
      currentRight = node.right;
    } else {
      if(node.left > currentRight) {
        currentRight = node.right;
        // done with break
        colBreaks.push(i)
      } else {
        // same row
        if(node.right > currentRight) {
          currentRight = node.right
        }
      }
    }

  })

  colBreaks.push(orderedNodeIds.length)
  let cols = [];

  for(let i=0; i<colBreaks.length-1; i++) {
    const comps = orderedNodeIds.slice(colBreaks[i], colBreaks[i+1]);

    if(comps.length == 1) {
      const children = parentChildren[comps[0]] ? parentChildren[comps[0]] : [];
      cols.push({
        id: comps[0],
        children: flexBox(children, idDims, parentChildren, childParent)
      })
    } else if(comps.length == orderedNodeIds.length) {
      let parentDims = idDims[childParent[comps[0]]];
      const newLeft = minLeft(comps, idDims);
      const newRight = maxRight(comps, idDims);

      if(newLeft) {
        parentDims.left = newLeft
      }
      if(newRight) {
        parentDims.right = newRight
      }

      cols.push({
        id: 'column',
        parentDims,
        children: comps.map((c) => {
          const children = parentChildren[c] ? parentChildren[c] : [];
          return { 
            id: c,
            children: flexBox(children, idDims, parentChildren, childParent)
          }
        })
      });
    } else {
      let parentDims = idDims[childParent[comps[0]]];
      const newLeft = minLeft(comps, idDims);
      const newRight = maxRight(comps, idDims);

      if(newLeft) {
        parentDims.left = newLeft
      }
      if(newRight) {
        parentDims.right = newRight
      }

      cols.push({
        id: 'column',
        parentDims,
        children: flexRows(comps, idDims, parentChildren, childParent)
      })
    }
  }

  return cols.length == 1 ? cols[0] : cols;
}



const flexRows = (nodeIds, idDims, parentChildren, childParent) => {
  if(nodeIds.length == 0) {
    return nodeIds
  }

  const orderedNodeIds = nodeIds.sort((a, b) => {
    const adims = idDims[a];
    const bdims = idDims[b];

    if(adims.top == bdims.top) {
      return adims.left - bdims.left;
    }

    return adims.top - bdims.top
  });

  let rowBreaks = [0];
  let currentBottom = null;

  orderedNodeIds.forEach((nodeId, i) => {
    // TODO: node is sometimes null here?
    const node = idDims[nodeId];
    if(!currentBottom) {
      currentBottom = node && node.bottom;
    } else {
      if(node.top > currentBottom) {
        currentBottom = node && node.bottom;
        // done with break
        rowBreaks.push(i)
      } else {
        // same row
        if(node && node.bottom > currentBottom) {
          currentBottom = node && node.bottom
        }
      }
    }

  })

  rowBreaks.push(orderedNodeIds.length)
  let rows = [];


  for(let i=0; i<rowBreaks.length-1; i++) {
    const comps = orderedNodeIds.slice(rowBreaks[i], rowBreaks[i+1]);
    if(comps.length == 1) {
      const children = parentChildren[comps[0]] ? parentChildren[comps[0]] : [];
      rows.push({
        id: comps[0],
        children: flexBox(children, idDims, parentChildren, childParent)
      });
    } else if(comps.length == orderedNodeIds.length) {
      let parentDims = idDims[childParent[comps[0]]];
      const newTop = minTop(comps, idDims);
      const newBottom = maxBottom(comps, idDims);

      if(newTop) {
        parentDims.top = newTop
      }
      if(newBottom) {
        parentDims.bottom = newBottom
      }

      rows.push({
        id: 'row',
        parentDims,
        children: comps.map((c) => {
          const children = parentChildren[c] ? parentChildren[c] : [];
          return {
            id: c,
            children: flexBox(children, idDims, parentChildren, childParent)
          }
        })
      });
    } else {
      let parentDims = idDims[childParent[comps[0]]];
      const newTop = minTop(comps, idDims);
      const newBottom = maxBottom(comps, idDims);

      if(newTop) {
        parentDims.top = newTop
      }
      if(newBottom) {
        parentDims.bottom = newBottom
      }

      rows.push({
        id: 'row',
        parentDims,
        children: flexColumns(comps, idDims, parentChildren, childParent)
      })
    }
  }

  return rows.length == 1 ? rows[0] : rows;
}




const minTop = (ids, idDims) => {
  let min = idDims[ids[0]].top
  ids.forEach((id) => {
    if(idDims[ids[0]].top < min) {
      min = idDims[ids[0]].top;
    }
  })
  return min
}

const maxBottom = (ids, idDims) => {
  let max = ids && ids[0] && idDims[ids[0]] && idDims[ids[0]].bottom
  ids.forEach((id) => {
    if(idDims[ids[0]].bottom > max) {
      max = idDims[ids[0]].bottom;
    }
  })
  return max
}


const minLeft = (ids, idDims) => {
  let min = idDims[ids[0]].left
  ids.forEach((id) => {
    if(idDims[ids[0]].left < min) {
      min = idDims[ids[0]].left;
    }
  })
  return min
}

const maxRight = (ids, idDims) => {
  let max = idDims[ids[0]].right
  ids.forEach((id) => {
    if(idDims[ids[0]].right > max) {
      max = idDims[ids[0]].right;
    }
  })
  return max
}




const flexBox = (nodeIds, idDims, parentChildren, childParent) => {
  // NOTE! nodes here can be cols or rows; currently it's just
  // based on whatever they are in the design... This 
  // will have to be addressed when there is a design that 
  // has sibling columns instead of rows.
  
  // SO, a todo here is to detect if siblings are rows or columns
  // (can they be both? no. have to break up into rows first, or cols first.)
  return flexRows(nodeIds, idDims, parentChildren, childParent)
}





const flattenBoxComponents = (comps, roodId, idDims, jsObjs, indent=0) => {
  let flatEles = [];
   
  const flattenBoxComps = (comps, rootId, idDims, jsObjs, indent=0) => {
    if(comps.id && comps.children && comps.children.id) {
      // single element with one child
      const compDims = idDims[comps.id];
      const rootDims = idDims[rootId];
      if(rootDims.top == compDims.top && rootDims.bottom == compDims.bottom && rootDims.left == compDims.left && rootDims.right == compDims.right) {
        flattenBoxComps(comps.children, rootId, idDims, jsObjs, indent)
        return flatEles
      }
    }

    const spaces = '        ' + new Array(indent + 1).join('  ');
    if(comps && comps.id) {
      const hasChildren = comps.children && comps.children.id || comps.children.length > 0;
      
      let alignJustify = {}
      if(hasChildren) {
        alignJustify = determineAlignJustify(comps, comps.children, idDims, jsObjs);
      }

      flatEles.push({spaces, id: comps.id, single: !hasChildren, alignJustify});
      if(hasChildren) {
        flattenBoxComps(comps.children, rootId, idDims, jsObjs, indent + 1)
        flatEles.push({spaces, id: comps.id, end: true});
      }
    }
    if(comps && Array.isArray(comps)) {
      comps.forEach((comp) => {
        const hasChildren = comp.children && comp.children.id || comp.children.length > 0;
        
        let alignJustify = {}
        if(hasChildren) {
          alignJustify = determineAlignJustify(comp, comp.children, idDims, jsObjs);
        }

        flatEles.push({spaces, id: comp.id, single: !hasChildren, alignJustify});
        if(hasChildren) {
          flattenBoxComps(comp.children, rootId, idDims, jsObjs, indent + 1)
          flatEles.push({spaces, id: comp.id, end: true});              
        }
      })
    }
  }

  flattenBoxComps(comps, roodId, idDims, jsObjs, indent);

  return flatEles;
}




module.exports.flexBox = flexBox;
module.exports.flattenBoxComponents = flattenBoxComponents;
