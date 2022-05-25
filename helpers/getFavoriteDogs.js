const AdoptableDog = require("../models/adoptableDog");
const { getDog } = require("../helpers/getDogs");

const getFavoriteDogsInfo = async dogIds => {
  let dogs = [];
  for (let i = 0; i < dogIds.length; i++) {
    let dbResponse = await AdoptableDog.get(dogIds[i]);
    let petFinderresponse = await getDog(dogIds[i]);
    if (dbResponse !== null && petFinderresponse === null) {
      dogs.push(dbResponse);
    } else if (petFinderresponse !== null && dbResponse === null) {
      dogs.push(petFinderresponse);
    } else if (dbResponse === null && petFinderresponse === null) {
      dogs.push("");
    }
  }
  return dogs;
};

module.exports = getFavoriteDogsInfo;
