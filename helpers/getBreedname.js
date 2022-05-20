const db = require("../db");

getBreedName = async id => {
  const response = await db.query(
    `SELECT breed 
            FROM breed
            WHERE id = $1`,
    [id]
  );
  if (response.rows[0].breed) {
    return response.rows[0].breed;
  } else {
    return `Breed ${id} does not exist`;
  }
};

module.exports = getBreedName;
