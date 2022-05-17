const db = require("../db");

async function getBreedName(id) {
  const response = await db.query(
    `SELECT breed 
            FROM breed
            WHERE id = $1`,
    [id]
  );
  if (response.rows[0].breed) {
    return breed;
  } else {
    return `Breed ${id} does not exist`;
  }
}

module.exports = getBreedName;
