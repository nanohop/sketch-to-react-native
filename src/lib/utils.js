// TODO: remove hardcoded values

const aboutZero = (a) => {
  return Math.abs(a-0) < 6
}

const aboutCentered = (a, b) => {
  return Math.abs(a-b) < 17 
}

const aboutEqual = (a, b) => {
  return Math.abs(a-b) < 6
}

const smallComparedTo = (a, b) => {
  if(aboutZero(a) && !aboutZero(b)) {
    return true
  }
  const ratio = b / a;
  return(a != 0 && ratio > 0.5)
}

const allAboutEqual = (arr) => {
  const avg = arr.reduce(function(sum, a) { return sum + a },0)/(arr.length||1);
  return arr.filter((ele) => {
    return !aboutEqual(avg, ele)
  }).length == 0;
}


module.exports.aboutZero = aboutZero;
module.exports.aboutCentered = aboutCentered;
module.exports.aboutEqual = aboutEqual;
module.exports.allAboutEqual = allAboutEqual;
module.exports.smallComparedTo = smallComparedTo;
