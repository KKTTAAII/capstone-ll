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
const DEFAULT_PIC = require("../assets/v987-11a.jpg");

/**Related functions for shelters */
/**credit DEFAULT_PIC <a href='https://www.freepik.com/vectors/paw-logo'>Paw logo vector created by rawpixel.com - www.freepik.com</a> */

class Shelter {
  /** authenticate shelter user with username, password.
   *
   * Returns { username, name, email }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/
  static async authenticate({ username, password }) {
    //try to find the shelter user first
    const result = await db.query(
      `SELECT username, password, name, email, is_admin
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
    } else {
      throw new UnauthorizedError("Invalid username/password");
    }
  }

  /**Create and Register a shelter from data, update db, return new shelter data
   *
   * data should be {username, password, name, address, city, state, postcode, phone_number, email, logo, description}
   *
   * returns {username, password, name, address, city, state, postcode, phone_number, email, logo, description}
   *
   * Throws BadRequestError if company already in db
   */

  static async register({
    username,
    password,
    name,
    address = "",
    city,
    state,
    postcode = "",
    phone_number,
    email,
    logo = DEFAULT_PIC,
    description = "",
    is_admin = false,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username, name
            FROM shelters
            WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate shelter username: ${name}`);

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
        RETURNING username, 
                name, 
                address, 
                city, 
                state, 
                postcode, 
                phone_number AS "phone", e
                mail, logo, 
                descripntion, 
                is_admin`,
      [
        username,
        hashedPassword,
        name,
        address,
        city,
        state,
        postcode,
        phone_number,
        email,
        logo,
        description,
        is_admin,
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
   *
   * Returns [{username, name, email, phone_number, city, state, is_admin}]
   */
  static async findAll(searchFilters = {}) {
    let query = `SELECT s.username,
                s.name,
                s.email,
                s.phone_number, 
                s.city,
                s.state, 
                s.is_admin,
                a.name AS dog_name,
                a.breed_id AS breed,
                a.gender 
                a.picture
            FROM shelters s
            JOIN adoptable_dogs a
            ON s.id = a.shelter_id`;
    let whereExpressions = [];
    let queryValues = [];
    const { name, city, state } = searchFilters;

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

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY s.name";
    const sheltersRes = await db.query(query, queryValues);
    return sheltersRes.rows;
  }

  /** Given a shelter name, return data about shelter.
   *
   * Returns { id, username, name, email, phone_number, city, state, is_admin  }
   *   where adoptable_dogs is [{ name, breed_id, gender, age, picture, description }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async get(username) {
    const shelterRes = await db.query(
      `SELECT  id,
                username,
                name,
                email,
                phone_number, 
                city, 
                state,
                is_admin
            FROM shelters
            WHERE username = $1`,
      [username]
    );

    const shelter = shelterRes.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${username}`);

    const adoptable_dogsRes = await db.query(
      `SELECT name,
                breed_id,
                gender,
                age,
                picture,
                description
            FROM adoptable_dogs
            WHERE shelter_id = $1`,
      [shelter.id]
    );

    shelter.adoptable_dogs = adoptable_dogsRes.rows;

    return shelter;
  }

  /** Update shelter data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, address, city, state, postcode, phone_number, email, logo, description}
   *
   * Returns {username, name, address, city, state, postcode, phone_number, email, logo, description}
   *
   * Throws NotFoundError if not found.
   */
  static async update(username, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      phonNumber: "phone_number",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE shelters
                        SET ${setCols}
                        WHERE username = ${handleVarIdx}
                        RETURNING username,
                                    name,
                                    address,
                                    city,
                                    state,
                                    postcode,
                                    phone_number AS phoneNumber,
                                    email,
                                    logo,
                                    description`;
    const result = await db.query(querySql, [...values, username]);
    const shelter = result.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${username}`);

    return company;
  }

  /**Delete given shelter from db; return 'deleted'
   *
   * throws NotFoundError if shelter not found
   */
  static async remove(username) {
    const result = await db.query(
      `DELETE 
             FROM shelters
             WHERE username = $1
             RETURNING username`,
      [username]
    );

    const shelter = result.rows[0];

    if (!shelter) throw new NotFoundError(`No shelter: ${username}`);

    return { delete: "Shelter Deleted" };
  }
}
