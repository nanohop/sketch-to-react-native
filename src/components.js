
const generateChildParent = (orderedIds, idDims) => {
  let childParent = {};

  orderedIds.forEach((key) => {
    const dims = idDims[key];
    const top = Math.min(dims.top, dims.bottom);
    const bottom = Math.max(dims.top, dims.bottom);
    const left = Math.min(dims.left, dims.right);
    const right = Math.max(dims.left, dims.right);
    const height = dims.height;
    const width = dims.width;

    const parentNodes = orderedIds.filter((pKey) => {
      if(key == pKey) {
        return false;
      }

      const pDims = idDims[pKey];
      const ptop = Math.min(pDims.top, pDims.bottom);
      const pbottom = Math.max(pDims.top, pDims.bottom);
      const pleft = Math.min(pDims.left, pDims.right);
      const pright = Math.max(pDims.left, pDims.right);
      const pheight = pDims.height;
      const pwidth = pDims.width;

      return(top >= ptop && bottom <= pbottom && left >= pleft && right <= pright) 
    })

    if(parentNodes.length > 0) {
      for(let i = parentNodes.length - 1; i>=0; i--) {
        if(orderedIds.indexOf(parentNodes[i]) < orderedIds.indexOf(key)) {
          childParent[key] = parentNodes[i]
          break;
        }
      }
    }

  });

  return childParent;
}

module.exports.generateChildParent = generateChildParent;

