const axios = require("axios");
const { NotFoundError, ExpressError } = require("../expressError");
const BASE_URL = "https://api.petfinder.com/v2";
const getPetfinderToken = require("./petFinderToken");
const DEFAULT_PIC = "../assets/shelter.jpg";

/* Get shelters from petFinder API
 * user can filter by name, city, state, or postcode
 * return [{shelter},...]
 */
async function getShelters(searchFilters = {}) {
  try {
    const access_token = await getPetfinderToken();
    const { name, state, postcode, city } = searchFilters;
    let query = "";

    if (name) {
      query += `&name=${name}`;
    }

    if (city) {
      query += `&query=${city}`;
    }

    if (state) {
      query += `&state=${state}`;
    }
    if (postcode) {
      query += `&location=${postcode}`;
    }

    const shelterResponse = await axios.get(
      `${BASE_URL}/organizations?limit=50${query}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { organizations } = shelterResponse.data;
    const organizationsInfo = organizations.map(organization => {
      const { id, name, address, phone, email, photos, mission_statement } =
        organization;
      return {
        id,
        name,
        address: address.address1,
        city: address.city,
        state: address.state,
        postode: address.postcode,
        phoneNumber: phone,
        email,
        logo: photos[0] ? photos[0].small : DEFAULT_PIC,
        description: mission_statement,
      };
    });
    return organizationsInfo;
  } catch (err) {
    if (!err.response) {
      console.log(err);
      throw new Error(err);
    } else {
      console.log("ERROR", err.response.status, err.response.statusText);
      throw new ExpressError(err.response.statusText, err.response.status);
    }
  }
}

/** Get a single shelter using id
 * return {shelter, adoptableDogs}
 */
async function getShelter(id) {
  try {
    const access_token = await getPetfinderToken();
    const shelterResponse = await axios.get(`${BASE_URL}/organizations/${id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const { organization } = shelterResponse.data;
    console.log(`${BASE_URL}/organizations/${id}`);

    if (organization.id) {
      //If we find a shelter with that id, we get their adoptable dogs as well
      const shelterAnimalsResponse = await axios.get(
        `${BASE_URL}/animals?organization=${organization.id}&type=dog`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      let adoptableDogs;
      if (shelterAnimalsResponse.data.animals.length > 0) {
        const shelterPets = shelterAnimalsResponse.data.animals;
        adoptableDogs = shelterPets.map(pet => {
          const { id, name, breeds, gender, age, photos } = pet;
          return {
            id: id,
            name: name,
            breedId: breeds.primary,
            gender: gender,
            age: age,
            picture: photos[0] ? photos[0].small : DEFAULT_PIC,
          };
        });
      }

      const { id, name, address, phone, email, photos, mission_statement } =
        organization;

      return {
        id: id,
        name: name,
        address: address.address1,
        city: address.city,
        state: address.state,
        postode: address.postcode,
        phoneNumber: phone,
        email: email,
        logo: photos[0] ? photos[0].medium : DEFAULT_PIC,
        description: mission_statement,
        adoptableDogs: adoptableDogs,
      };
    } else {
      throw new NotFoundError(`no shelter ${id}/ shelter no longer exists`);
    }
  } catch (err) {
    if (!err.response) {
      console.log(err);
      throw new Error(err);
    } else {
      console.log("ERROR", err.response.status, err.response.statusText);
      throw new ExpressError(err.response.statusText, err.response.status);
    }
  }
}

module.exports = { getShelters, getShelter };
