"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const DEFAULT_PIC = "../assets/dog.png";
// "https://www.templateupdates.com/wp-content/uploads/2018/03/Cute-Dog-Icon-Set-Template.jpg";
/**DEFAULT PIC credit: <a href="https://www.flaticon.com/free-icons/dog" title="dog icons">Dog icons created by Flat Icons - Flaticon</a> */

class AdoptableDog {
  /**Create an adoptable_dog, update db, return new adoptable_dog data
   *
   * data should be {name,
   * breed_id,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCcats,
   * shelterId}
   *
   * returns {id,
   * name,
   * breed_id,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCcats,
   * shelterId}
   *
   * Throws BadRequestError if a dog already in db
   */

  static async create({
    name,
    breedId,
    gender,
    age,
    picture = DEFAULT_PIC,
    description = "",
    goodWKids = false,
    goodWDogs = false,
    goodWCats = false,
    shelterId,
  }) {
    const result = await db.query(
      `INSERT INTO adoptable_dogs
            (name, 
            breed_id, 
            gender, 
            age, 
            picture, 
            description, 
            good_w_kids, 
            good_w_dogs, 
            good_w_cats, 
            shelter_id)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id,
                    name, 
                    breed_id AS "breedId", 
                    gender, 
                    age, 
                    picture, 
                    description,  
                    good_w_kids AS "goodWKids", 
                    good_w_dogs AS "goodWDogs", 
                    good_w_cats AS "goodWCats", 
                    shelter_id AS "shelterId"`,
      [
        name,
        breedId,
        gender,
        age,
        picture,
        description,
        goodWKids,
        goodWDogs,
        goodWCats,
        shelterId,
      ]
    );

    const adoptable_dog = result.rows[0];

    return adoptable_dog;
  }

  /**Find all adoptable_dogs(optional filter on searchFilters)
   *
   * searchFilters (all optional):
   * -name (will find case-insensitive parital matches)
   * -breedId
   * -gender
   * -age
   * -goodWKids
   * -goodWDogs
   * -goodWCats
   *
   * Returns [{id,
   * name,
   * breedId,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCcats,
   * shelterId}]
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT a.id,
                        a.name,
                        a.gender, 
                        a.age, 
                        a.picture, 
                        a.description, 
                        a.good_w_kids AS "goodWKids", 
                        a.good_w_dogs AS "goodWDogs", 
                        a.good_w_cats AS "goodWCats", 
                        s.id AS "shelterId",
                        b.breed
                    FROM adoptable_dogs a
                    JOIN shelters s
                    ON s.id = a.shelter_id
                    JOIN breed b
                    ON b.id = a.breed_id`;
    let whereExpressions = [];
    let queryValues = [];
    let { name, breedId, gender, age, goodWKids, goodWDogs, goodWCats } =
      searchFilters;

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`a.name ILIKE $${queryValues.length}`);
    }

    if (breedId) {
      queryValues.push(`${breedId}`);
      whereExpressions.push(`b.id = $${queryValues.length}`);
    }

    if (gender) {
      queryValues.push(`%${gender}%`);
      whereExpressions.push(`gender ILIKE $${queryValues.length}`);
    }

    if (age) {
      queryValues.push(`%${age}%`);
      whereExpressions.push(`age ILIKE $${queryValues.length}`);
    }

    if (goodWKids) {
      goodWKids = goodWKids === "yes" ? true : false;
      queryValues.push(`${goodWKids}`);
      whereExpressions.push(`good_w_kids = $${queryValues.length}`);
    }

    if (goodWDogs) {
      goodWDogs = goodWDogs === "yes" ? true : false;
      queryValues.push(`${goodWDogs}`);
      whereExpressions.push(`good_w_dogs = $${queryValues.length}`);
    }

    if (goodWCats) {
      goodWCats = goodWCats === "yes" ? true : false;
      queryValues.push(`${goodWCats}`);
      whereExpressions.push(`good_w_cats = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY s.name";
    const adoptable_dogsRes = await db.query(query, queryValues);

    if (!adoptable_dogsRes.rows[0]) {
      console.log(`No shelters Found`);
      return;
    }
    return adoptable_dogsRes.rows;
  }

  /** Given a dog id.
   *
   * Returns { id,
   * name,
   * breedId,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCcats,
   * shelterId}
   *
   * where shelter is [{ username, name, city, state, email, phoneNumber }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const adoptable_dogRes = await db.query(
      `SELECT  a.id,
                a.name, 
                b.breed, 
                a.gender, 
                a.age, 
                a.picture, 
                a.description, 
                a.good_w_kids AS "goodWKids", 
                a.good_w_dogs AS "goodWDogs", 
                a.good_w_cats AS "goodWCats",
                a.shelter_id AS "shelterId"
            FROM adoptable_dogs a
            JOIN breed b
            ON b.id = a.breed_id
            WHERE a.id = $1`,
      [id]
    );

    const adoptable_dog = adoptable_dogRes.rows[0];

    if (!adoptable_dog) return null;

    const shelterRes = await db.query(
      `SELECT id,
                name,
                address,
                city,
                state,
                postcode,
                phone_number AS "phoneNumber",
                email,
                logo,
                description
            FROM shelters
            WHERE id = $1`,
      [adoptable_dog.shelterId]
    );

    adoptable_dog.shelter = shelterRes.rows[0];

    return adoptable_dog;
  }

  /** Update adoptable data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name,
   * breed_id,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCats}
   *
   * Returns {id,
   * name,
   * breed_id,
   * gender,
   * age,
   * picture,
   * description,
   * goodWKids,
   * goodWDogs,
   * goodWCats}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      breedId: "breed_id",
      goodWKids: "good_w_kids",
      goodWDogs: "good_w_dogs",
      goodWCats: "good_w_cats",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE adoptable_dogs
                        SET ${setCols}
                        WHERE id = ${handleVarIdx}
                        RETURNING id,
                                    name, 
                                    breed_id, 
                                    gender, 
                                    age, 
                                    picture, 
                                    description, 
                                    good_w_kids AS "goodWKids",
                                    good_w_dogs AS "goodWDogs",
                                    good_w_cats AS "goodWCats"`;
    const result = await db.query(querySql, [...values, id]);
    const adoptable_dog = result.rows[0];

    if (!adoptable_dog) throw new NotFoundError(`No adoptable dog id: ${id}`);

    return adoptable_dog;
  }

  /**Delete given adoptable_dog id from db; return 'deleted'
   *
   * throws NotFoundError if adoptable not found
   */
  static async remove(id) {
    const result = await db.query(
      `DELETE 
             FROM adoptable_dogs
             WHERE id = $1
             RETURNING id`,
      [id]
    );

    const adoptable_dog = result.rows[0];

    if (!adoptable_dog) throw new NotFoundError(`No adoptable dog id: ${id}`);

    return { delete: "Adoptable dog Deleted" };
  }
}

module.exports = AdoptableDog;
