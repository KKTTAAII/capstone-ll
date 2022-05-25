const AdoptableDog = require("../models/adoptableDog");
const { getDog } = require("../helpers/getDogs");

const getFavoriteDogsInfo = async dogIds => {
  const dogs = [];
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
  //we will filter for only those dogs that are still active/in db
  const remainingDogs = dogs.filter(dog => dog !== "");
  return remainingDogs;
};

module.exports = getFavoriteDogsInfo;
