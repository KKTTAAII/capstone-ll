const db = require("../db");

async function getBreedName(id) {
  const response = await db.query(
    `SELECT breed 
            FROM breed
            WHERE id = $1`,
    [id]
  );
  const { breed } = response.rows[0];
  return breed;
}

module.exports = getBreedName;
