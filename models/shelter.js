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
const DEFAULT_PIC = "../assets/v987-11a.jpg";
// "https://cdn-icons-png.flaticon.com/512/3769/3769065.png";
/**credit DEFAULT_PIC <a href='https://www.freepik.com/vectors/paw-logo'>Paw logo vector created by rawpixel.com - www.freepik.com</a> */

/**Related functions for shelters */

class Shelter {
  /** authenticate shelter user with username, password.
   *
   * Returns { username, name, email, is_admin }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   **/
  static async authenticate(username, password) {
    //try to find the shelter user first
    const result = await db.query(
      `SELECT id, username, password, name, email, is_admin AS "isAdmin"
        FROM shelters
        WHERE username = $1`,
      [username]
    );

    const shelter = result.rows[0];

    if (shelter) {
      //compare hashed password to a new has from password
      const isValid = await bcrypt.compare(password, shelter.password);
      if (isValid) {
        delete shelter.password;
        return shelter;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /**Create and Register a shelter from data, update db, return new shelter data
   *
   * data should be {id,
   * username,
   * password,
   * name,
   * address,
   * city,
   * state,
   * postcode,
   * phoneNumber,
   * email,
   * logo,
   * description,
   * isAdmin}
   *
   * returns {username,
   * password,
   * name,
   * address,
   * city,
   * state,
   * postcode,
   * phoneNumber,
   * email,
   * logo,
   * description,
   * isAdmin}
   *
   * Throws BadRequestError if shelter already in db
   */

  static async register({
    username,
    password,
    name,
    address = "",
    city,
    state,
    postcode = "",
    phoneNumber,
    email,
    logo = DEFAULT_PIC,
    description = "",
    isAdmin,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username, name
            FROM shelters
            WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate shelter username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO shelters
        (username, 
         password, 
         name, 
         address, 
         city, 
         state, 
         postcode, 
         phone_number, 
         email, 
         logo, 
         description, 
         is_admin)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id,
                username, 
                name, 
                address, 
                city, 
                state, 
                postcode, 
                phone_number, 
                email, 
                logo, 
                description, 
                is_admin AS isAdmin`,
      [
        username,
        hashedPassword,
        name,
        address,
        city,
        state,
        postcode,
        phoneNumber,
        email,
        logo,
        description,
        isAdmin,
      ]
    );

    const shelter = result.rows[0];

    return shelter;
  }

  /**Find all shelters(optional filter on searchFilters)
   *
   * searchFilters (all optional):
   * -name (will find case-insensitive parital matches)
   * -city
   * -state
   * -postcode
   *
   * Returns [{username, name, email, phoneNumber, city, state, isAdmin}]
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT id, 
                username,
                name,
                email,
                phone_number AS "phoneNumber", 
                city,
                state,
                description,
                logo, 
                is_admin AS "isAdmin"
            FROM shelters`;
    let whereExpressions = [];
    let queryValues = [];
    const { name, city, state, postcode } = searchFilters;

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (city) {
      queryValues.push(`%${city}%`);
      whereExpressions.push(`city ILIKE $${queryValues.length}`);
    }

    if (state) {
      queryValues.push(`%${state}%`);
      whereExpressions.push(`state ILIKE $${queryValues.length}`);
    }

    if (postcode) {
      queryValues.push(`%${postcode}%`);
      whereExpressions.push(`postcode ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY name";

    const sheltersRes = await db.query(query, queryValues);

    if (!sheltersRes.rows[0]) throw new NotFoundError(`No shelters Found`);

    return sheltersRes.rows;
  }

  /** Given a shelter id, return data about shelter.
   *
   * Returns { id,
   * username,
   * name,
   * email,
   * phoneNumber,
   * city,
   * state,
   * isAdmin  }
   *
   *   where adoptableDogs are [{
   * name,
   * breedId,
   * gender,
   * age,
   * picture,
   * description }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const shelterRes = await db.query(
      `SELECT  id,
                username,
                name,
                email,
                phone_number AS "phoneNumber", 
                city, 
                state,
                is_admin AS "isAdmin"
            FROM shelters
            WHERE id = $1`,
      [id]
    );

    const shelter = shelterRes.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${id}`);

    const adoptableDogsRes = await db.query(
      `SELECT id,
                name,
                breed_id AS "breedId",
                gender,
                age,
                picture,
                description,
                good_w_kids AS "goodWKids",
                good_w_dogs AS "goodWDogs",
                good_w_cats AS "goodWCats"
            FROM adoptable_dogs
            WHERE shelter_id = $1`,
      [shelter.id]
    );

    shelter.adoptableDogs = adoptableDogsRes.rows;

    return shelter;
  }

  /** Update shelter data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name,
   * address,
   * city,
   * state,
   * postcode,
   * phoneNumber,
   * email,
   * logo,
   * description}
   *
   * Returns {username,
   * name,
   * address,
   * city,
   * state,
   * postcode,
   * phoneNumber,
   * email,
   * logo,
   * description}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      phoneNumber: "phone_number",
      isAdmin: "is_admin",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE shelters
                        SET ${setCols}
                        WHERE id = ${handleVarIdx}
                        RETURNING username,
                                    name,
                                    address,
                                    city,
                                    state,
                                    postcode,
                                    phone_number AS "phoneNumber",
                                    email,
                                    logo,
                                    description,
                                    is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, id]);
    const shelter = result.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${id}`);

    return shelter;
  }

  /**Delete given shelter from db; return 'deleted'
   *
   * throws NotFoundError if shelter not found
   */
  static async remove(id) {
    const result = await db.query(
      `DELETE 
             FROM shelters
             WHERE id = $1
             RETURNING username`,
      [id]
    );

    const shelter = result.rows[0];

    if (!shelter) {
      throw new NotFoundError(`No shelter: ${id}`);
    }

    return { delete: "Shelter Deleted" };
  }

  /**Update password of that user
   *
   * return {updated: password was updated}
   */
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `SELECT username, password, name, email, is_admin AS "isAdmin"
        FROM shelters
        WHERE id = $1`,
      [id]
    );

    const shelter = result.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${id}`);

    const updatePasswordRes = await db.query(
      `UPDATE shelters
                        SET password = $1
                        WHERE id = $2
                        RETURNING username`,
      [hashedPassword, id]
    );

    const response = updatePasswordRes.rows[0];

    return { updatedPassword: response };
  }
}

module.exports = Shelter;
