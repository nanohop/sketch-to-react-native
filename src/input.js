
const fs = require('fs');

const prepData = ({ data, tempDir, inputFile }) => {
  let idList = [];

  const oldDefs = data.match(/\<defs\>[\s\S]*\<\/defs\>/g)

  const newData = data.replace(/\sid=\"[^\"]+/g, function(d) {
    let onlyId = d.replace(/^\sid\=\"/, '').replace(/[^\_0-9a-zA-Z]/g, '');

    if(onlyId.match(/^[0-9]+/)) {
      onlyId = "_" + onlyId
    }
    
    d = ' id="' + onlyId;

    if(idList.indexOf(d) >= 0) {
      const newId = d + "_" + idList.length
      idList.push(newId)
      return newId
    } else {
      idList.push(d);
      return d;
    }
  });

  const preppedData = newData.replace(/\<defs\>[\s\S]*\<\/defs\>/g, oldDefs)

  fs.writeFileSync(tempDir + '/prepped_'+inputFile, preppedData)

  return preppedData;
}

module.exports.prepData = prepData;
