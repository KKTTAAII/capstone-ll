"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const DEFAULT_PIC = "../assets/user.png";
// "https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/user_male4-512.png";
/**credte DEFAULT_PIC <a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Becris - Flaticon</a> */

class Adopter {
  /** authenticate adopter user with username, password.
   *
   * Returns { username, name, email, is_admin }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   **/
  static async authenticate(username, password) {
    //try to find the adopter user first
    const result = await db.query(
      `SELECT id, username, password, email, is_admin AS "isAdmin"
        FROM adopters
        WHERE username = $1`,
      [username]
    );

    const adopter = result.rows[0];

    if (adopter) {
      //compare hashed password to a new has from password
      const isValid = await bcrypt.compare(password, adopter.password);
      if (isValid) {
        delete adopter.password;
        return adopter;
      }
    }
    throw new UnauthorizedError("Invalid username/password");
  }

  /**Create and Register an adopter from data, update db, return new adopter data
   *
   * data should be {username,
   * password,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge,
   * isAdmin}
   *
   * returns {username,
   * password,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge,
   * isAdmin}
   *
   * Throws BadRequestError if adopter already in db
   */

  static async register({
    username,
    password,
    email,
    picture = DEFAULT_PIC,
    description = "",
    privateOutdoors = false,
    numOfDogs = 0,
    preferredGender = "Male",
    preferredAge = "Young",
    isAdmin,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username
            FROM adopters
            WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate adopter username: ${username}`);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO adopters
        (username, 
         password,  
         email, 
         picture, 
         description, 
         private_outdoors,
         num_of_dogs,
         preferred_gender,
         preferred_age,   
         is_admin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, 
                    username, 
                    email,
                    picture,
                    description,
                    private_outdoors AS "privateOutdoors",
                    num_of_dogs AS "numOfDogs",
                    preferred_gender AS "preferredGender",
                    preferred_age AS "preferredAge",
                    is_admin AS "isAdmin"
               `,
      [
        username,
        hashedPassword,
        email,
        picture,
        description,
        privateOutdoors,
        numOfDogs,
        preferredGender,
        preferredAge,
        isAdmin,
      ]
    );

    const adopter = result.rows[0];

    return adopter;
  }

  /**Find all adopters(optional filter on searchFilters)
   *
   * searchFilters (all optional):
   * -username (will find case-insensitive parital matches)
   * -email
   *
   * Returns [{username,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge,
   * isAdmin}]
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT username,
                        email, 
                        picture,
                        description,
                        private_outdoors AS "privateOutdoors",
                        num_of_dogs AS "numOfDogs",
                        preferred_gender AS "preferredGender",
                        preferred_age AS "preferredAge",   
                        is_admin AS "isAdmin"
                      FROM adopters`;
    let whereExpressions = [];
    let queryValues = [];
    const { username, email } = searchFilters;

    if (username) {
      queryValues.push(`%${username}%`);
      whereExpressions.push(`username ILIKE $${queryValues.length}`);
    }

    if (email) {
      queryValues.push(`%${email}%`);
      whereExpressions.push(`email ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY username";
    const adoptersRes = await db.query(query, queryValues);
    return adoptersRes.rows;
  }

  /** Given an adopter username, return data about adopter.
   *
   * Returns { username,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge,
   * isAdmin  }
   *
   * where fav_dogs are [{
   *    name,
   *    breedId,
   *    gender,
   *    age,
   *    picture,
   *    description }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(username) {
    const adopterRes = await db.query(
      `SELECT  id,
                username,
                email, 
                picture,
                description,
                private_outdoors AS "privateOutdoors",
                num_of_dogs AS "numOfDogs",
                preferred_gender AS "preferredGender",
                preferred_age AS "preferredAge",   
                is_admin AS "isAdmin"
              FROM adopters
              WHERE username = $1`,
      [username]
    );

    const adopter = adopterRes.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    const fav_dogsRes = await db.query(
      `SELECT d.name,
                d.breed_id AS "breedId",
                d.gender,
                d.age,
                d.picture,
                d.description,
                d.shelter_id AS "shelterId"
            FROM adoptable_dogs d
            JOIN fav_dogs f
            ON f.adoptable_pets_id = d.id
            WHERE adopters_id = $1`,
      [adopter.id]
    );

    adopter.favDogs = fav_dogsRes.rows;

    return adopter;
  }

  /** Update adopter data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {username,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge}
   *
   * Returns {username,
   * email,
   * picture,
   * description,
   * privateOutdoors,
   * numOfDogs,
   * preferredGender,
   * preferredAge,
   * isAdmin}
   *
   * Throws NotFoundError if not found.
   */
  static async update(username, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      privateOutdoors: "private_outdoors",
      numOfDogs: "num_of_dogs",
      preferredGender: "preferred_gender",
      preferredAge: "preferred_age",
      isAdmin: "is_admin",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE adopters
                        SET ${setCols}
                        WHERE username = ${handleVarIdx}
                        RETURNING username,
                                  email, 
                                  picture,
                                  description,
                                  private_outdoors AS "privateOutdoors",
                                  num_of_dogs AS "numOfDogs",
                                  preferred_gender AS "preferredGender",
                                  preferred_age AS "preferredAge",   
                                  is_admin AS "isAdmin"`;

    const result = await db.query(querySql, [...values, username]);
    const adopter = result.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    return adopter;
  }

  /**Delete given adopter from db; return 'deleted'
   *
   * Throws NotFoundError if adopter not found
   */
  static async remove(username) {
    const result = await db.query(
      `DELETE 
             FROM adopters
             WHERE username = $1
             RETURNING username`,
      [username]
    );

    const adopter = result.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    return { delete: "Adopter Deleted" };
  }

  /**Get all favortie dogs from db.
   *
   * Throws NotFoundError if adopter not found
   */
  static async getFavorites(username) {
    const result = await db.query(
      `SELECT id, username, password, email, is_admin AS "isAdmin"
        FROM adopters
        WHERE username = $1`,
      [username]
    );

    const adopter = result.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    const favoriteDogsResponse = await db.query(
      `SELECT * FROM fav_dogs 
                WHERE adopters_id = $1`,
      [adopter.id]
    );

    const favoriteDogs = favoriteDogsResponse.rows;

    return favoriteDogs;
  }

  /**Like/Favorite a dog. Add to fav_dogs table */
  static async favorite(adoptablePetsId, username) {
    const adopterRes = await db.query(
      `SELECT username, id
            FROM adopters
            WHERE username = $1`,
      [username]
    );

    const adopter = adopterRes.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    const duplicateCheck = await db.query(
      `SELECT * FROM fav_dogs
                WHERE adopters_id = $1 AND adoptable_pets_id = $2`,

      [adopter.id, adoptablePetsId]
    );

    if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate favorite`);

    const favDogRes = await db.query(
      `INSERT INTO fav_dogs
                (adopters_id, adoptable_pets_id)
              VALUES ($1, $2)
              RETURNING adopters_id,
                        adoptable_pets_id`,
      [adopter.id, adoptablePetsId]
    );

    const favDog = favDogRes.rows[0];

    return favDog;
  }

  /**Unfavorite a dog. Delete it from the database */
  static async unFavorite(adoptablePetsId, username) {
    const adopterRes = await db.query(
      `SELECT username, id
            FROM adopters
            WHERE username = $1`,
      [username]
    );

    const adopter = adopterRes.rows[0];

    if (!adopter) throw new NotFoundError(`No adopter: ${username}`);

    const fav_dogRes = await db.query(
      `DELETE 
             FROM fav_dogs
             WHERE adopters_id = $1 AND adoptable_pets_id = $2
             RETURNING adoptable_pets_id`,
      [adopter.id, adoptablePetsId]
    );

    const fav_dog = fav_dogRes.rows[0];

    if (!fav_dog)
      throw new NotFoundError(
        `No favorited dog with that dog id ${adoptablePetsId} and username ${username}`
      );

    return { delete: "Favorite Dog Deleted" };
  }

  /**Update password of that user
   *
   * return {updated: password was updated}
   */
  static async updatePassword(username, password) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `SELECT username, password, email, is_admin AS "isAdmin"
        FROM adopters
        WHERE username = $1`,
      [username]
    );

    const shelter = result.rows[0];

    if (!shelter) throw new NotFoundError(`No adopter: ${username}`);

    const updatePasswordRes = await db.query(
      `UPDATE adopters
                        SET password = $1
                        WHERE username = $2
                        RETURNING username`,
      [hashedPassword, username]
    );

    return { updatePassword: "password update sucessfully" };
  }
}

module.exports = Adopter;
