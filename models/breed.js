"use strict";

const db = require("../db");
const CLIENTID = process.env.API_KEY;
const CLIENTSECRET = process.env.SECRET;
const axios = require("axios");

class Breed {
  /**Get all dog breeds from API and insert them to db */
  static async getBreeds() {
    let access_token;
    const response = await axios.post(
      "https://api.petfinder.com/v2/oauth2/token",
      `grant_type=client_credentials&client_id=${CLIENTID}&client_secret=${CLIENTSECRET}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.access_token) {
      access_token = response.access_token;
    }

    const breedRes = await axios.get(
      `https://api.petfinder.com/v2/types/Dog/breeds`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    //get an array of names back
    const breedNames = breedRes.breedRes.map(obj => obj.name);

    breedNames.forEach(async (el, ind) => {
      await db.query(
        `INSERT INTO breeds
            (id, breed)
            VALUES ($1, $2)
            RETURNING id, breed`,
        [ind + 1, el]
      );
    });

    const breeds = await db.query(`SELECT * FROM breed`);
    return breeds;
  }
}

module.exports = Breed;
