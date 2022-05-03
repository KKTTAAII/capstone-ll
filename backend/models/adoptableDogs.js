"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const DEFAULT_PIC = require("../assets/dog.png");
/**DEFAULT PIC credit: <a href="https://www.flaticon.com/free-icons/dog" title="dog icons">Dog icons created by Flat Icons - Flaticon</a> */

class Adoptable_dog {
  /**Create an adoptable_dog, update db, return new adoptable_dog data
   *
   * data should be {name, 
   * breed_id, 
   * gender, 
   * age, 
   * picture, 
   * description, 
   * daysAtShelter, 
   * goodWKids, 
   * goodWDogs, 
   * goodWCcats, 
   * shelterId}
   *
   * returns {name, 
   * breed_id, 
   * gender, 
   * age, 
   * picture, 
   * description, 
   * daysAtShelter, 
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
    description,
    daysAtShelter,
    goodWKids,
    goodWDogs,
    goodWCats,
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
            days_at_shelter, 
            good_w_kids, 
            good_w_dogs, 
            good_w_cats, 
            shelter_id)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING name, 
                    breed_id AS "breedId", 
                    gender, 
                    age, 
                    picture, 
                    description, 
                    days_at_shelter AS "daysAtShelter", 
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
        daysAtShelter,
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
   * Returns [{name, 
   * breedId, 
   * gender, 
   * age, 
   * picture, 
   * description, 
   * daysAtShelter, 
   * goodWKids, 
   * goodWDogs, 
   * goodWCcats, 
   * shelterId}]
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT a.name,
                        a.gender, 
                        a.age, 
                        a.picture, 
                        a.description, 
                        a.days_at_shelter AS "daysAtShelter", 
                        a.good_w_kids AS "goodWKids", 
                        a.good_w_dogs AS "goodWDogs", 
                        a.good_w_cats AS "goodWCats", 
                        s.name,
                        b.breed
                    FROM adoptable_dogs
                    JOIN shelters s
                    ON s.id = a.shelter_id
                    JOIN breed b
                    ON b.id = a.breed_id`;
    let whereExpressions = [];
    let queryValues = [];
    const { name, breedId, gender, age, goodWKids, goodWDogs, goodWCats } =
      searchFilters;

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (breedId) {
      queryValues.push(`%${breedId}%`);
      whereExpressions.push(`breed_id ILIKE $${queryValues.length}`);
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
      queryValues.push(`%${goodWKids}%`);
      whereExpressions.push(`good_w_kids ILIKE $${queryValues.length}`);
    }

    if (goodWDogs) {
      queryValues.push(`%${goodWDogs}%`);
      whereExpressions.push(`good_w_dogs ILIKE $${queryValues.length}`);
    }

    if (goodWCats) {
      queryValues.push(`%${goodWCats}%`);
      whereExpressions.push(`good_w_cats ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY s.name";
    const adoptable_dogsRes = await db.query(query, queryValues);
    return adoptable_dogsRes.rows;
  }

  /** Given a dog id.
   *
   * Returns { name, 
   * breedId, 
   * gender, 
   * age, 
   * picture, 
   * description, 
   * daysAtShelter, 
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
      `SELECT  name, 
                breed_id AS "breedId", 
                gender, 
                age, 
                picture, 
                description, 
                days_at_shelter AS "daysAtShelter", 
                good_w_kids AS "goodWKids", 
                good_w_dogs AS "goodWDogs", 
                good_w_cats AS "goodWCats", 
                shelter_id AS "shelterId"
            FROM adoptable_dogs
            WHERE id = $1`,
      [id]
    );

    const adoptable_dog = adoptable_dogRes.rows[0];

    if (!adoptable_dog) throw new NotFoundError(`No adoptable dog id: ${id}`);

    const shelterRes = await db.query(
      `SELECT username,
                name,
                city,
                state,
                email,
                phone_number AS "phoneNumber"
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
   * daysAtShelter,
   * goodWKids,
   * goodWDogs,
   * goodWCats}
   *
   * Returns {name,
   * breed_id,
   * gender,
   * age,
   * picture,
   * description,
   * daysAtShelter,
   * goodWKids,
   * goodWDogs,
   * goodWCats}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      breedId: "breed_id",
      daysAtShelter: "days_at_shelter",
      goodWKids: "good_w_kids",
      goodWDogs: "good_w_dogs",
      goodWCats: "good_w_cats",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE adoptable_dogs
                        SET ${setCols}
                        WHERE id = ${handleVarIdx}
                        RETURNING name, 
                                    breed_id, 
                                    gender, 
                                    age, 
                                    picture, 
                                    description, 
                                    daysAtShelter,
                                    goodWKids,
                                    goodWDogs,
                                    goodWCats`;
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

    if (!adoptable_dog) throw new NotFoundError(`No shelter: ${id}`);

    return { delete: "Adoptable dog Deleted" };
  }
}
