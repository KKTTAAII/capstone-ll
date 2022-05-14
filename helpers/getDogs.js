const axios = require("axios");
const { ExpressError } = require("../expressError");
const BASE_URL = "https://api.petfinder.com/v2";
const getPetfinderToken = require("./petFinderToken");
const getBreed = require("./getBreedname");
const { getShelter } = require("./getShelters");
const AdoptableDog = require("../models/adoptableDog");

/**Get adoptable dogs from petFinder API
 * user can filter by
 * -name (will find case-insensitive parital matches)
 * -breedId
 * -gender
 * -age
 * -goodWKids
 * -goodWDogs
 * -goodWCats
 * return [{dog}, ...]
 */
async function getDogs(searchFilters = {}) {
  try {
    const access_token = await getPetfinderToken();
    let { name, breedId, gender, age, goodWKids, goodWDogs, goodWCats } =
      searchFilters;
    let query = "";

    if (name) {
      query = `&name=${name}`;
    }
    //gotta translate the id into breedName first
    if (breedId) {
      const breedName = await getBreed(+breedId);
      query = `&breed=${breedName}`;
    }

    if (gender) {
      query = `&gender=${gender}`;
    }

    if (age) {
      query = `&age=${age}`;
    }

    if (goodWKids) {
      goodWKids = goodWKids === "yes" ? true : false;
      query = `&good_with_children=${goodWKids}`;
    }

    if (goodWDogs) {
      goodWDogs = goodWDogs === "yes" ? true : false;
      query = `&good_with_dogs=${goodWDogs}`;
    }

    if (goodWCats) {
      goodWCats = goodWCats === "yes" ? true : false;
      query = `&good_with_cats=${goodWCats}`;
    }

    const dogResponse = await axios.get(
      `${BASE_URL}/animals?type=dog&limit=100${query}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const { animals } = dogResponse.data;
    const dogsInfo = animals.map(dog => {
      const {
        id,
        name,
        breeds,
        gender,
        age,
        photos,
        description,
        environment,
        organization_id,
      } = dog;
      return {
        id: id,
        name: name,
        gender: gender,
        age: age,
        picture: photos[0] ? photos[0].medium : "",
        description: description,
        goodWKids: environment.children,
        goodWDogs: environment.dogs,
        goodWCats: environment.cats,
        shelterId: organization_id,
        breed: breeds.primary,
      };
    });
    return dogsInfo;
  } catch (err) {
    console.log("ERROR", err.response.status, err.response.statusText);
    throw new ExpressError(err.response.statusText, err.response.status);
  }
}

/** Get a single dog using id
 * return {dog}
 */
async function getDog(dogId) {
  try {
    const access_token = await getPetfinderToken();
    const animalResponse = await axios.get(`${BASE_URL}/animals/${dogId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const { animal } = animalResponse.data;
    const {
      id,
      name,
      breeds,
      gender,
      age,
      photos,
      description,
      environment,
      organization_id,
    } = animal;
    const shelter = await getShelter(organization_id);
    delete shelter.adoptableDogs;
    return {
      id: id,
      name: name,
      breed: breeds.primary,
      gender: gender,
      age: age,
      picture: photos[0] ? photos[0].medium : "",
      description: description,
      goodWKids: environment.children,
      goodWDogs: environment.dogs,
      goodWCats: environment.cats,
      shelterId: organization_id,
      shelter: shelter,
    };
  } catch (err) {
    console.log("ERROR", err.response.statusText);
    if (err.response.statusText === "Not Found") {
      return null;
    } else {
      throw new ExpressError(err.response.statusText, err.response.status);
    }
  }
}

module.exports = { getDogs, getDog };