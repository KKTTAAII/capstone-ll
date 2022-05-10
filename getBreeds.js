const axios = require("axios");
require("dotenv").config();
const BASE_URL = "https://api.petfinder.com/v2";

const getbreed = async () => {
  const API_KEY = process.env.API_KEY;
  const SECRET = process.env.SECRET;
  const response = await axios.post(
    `${BASE_URL}/oauth2/token`,
    `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const token = response.data.access_token;

  const breedResponse = await axios.get(`${BASE_URL}/types/dog/breeds`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const allBreeds = breedResponse.data.breeds;
  allBreeds.forEach((obj, ind) => console.log(`(${ind + 1}, '${obj.name}')`));
};

