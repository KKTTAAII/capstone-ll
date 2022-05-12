const axios = require("axios");
const BASE_URL = "https://api.petfinder.com/v2";

async function getPetfinderToken() {
  try {
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

    const { access_token } = response.data;
    return access_token;
  } catch (err) {
    console.log(err);
    return err;
  }
}

module.exports = getPetfinderToken;
