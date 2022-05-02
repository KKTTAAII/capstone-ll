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
const DEFAULT_PIC = require("../assets/user.png");
/**credte DEFAULT_PIC <a href="https://www.flaticon.com/free-icons/user" title="user icons">User icons created by Becris - Flaticon</a> */

class Adopter {
  /** authenticate adopter user with username, password.
   *
   * Returns { username, name, email }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   **/
  static async authenticate({ username, password }) {
    //try to find the adopter user first
    const result = await db.query(
      `SELECT username, password, email, is_admin
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
    } else {
      throw new UnauthorizedError("Invalid username/password");
    }
  }

  /**Create and Register an adopter from data, update db, return new adopter data
   *
   * data should be {username, password, email, picture, description, private_outdoors, num_of_dogs, preferred_gender, preferred_age, is_admin}
   *
   * returns {username, password, email, picture, description, private_outdoors, num_of_dogs, preferred_gender, preferred_age, is_admin}
   *
   * Throws BadRequestError if adopter already in db
   */

  static async register({
    username,
    password,
    email,
    picture = DEFAULT_PIC,
    description = "",
    privateOutdoors,
    numOfDogs,
    preferredGender,
    preferredAge,
    isAdmin = false,
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
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING username, 
                    email,
                    picture,
                    description,
                    private_outdoors AS "privateOutdoors",
                    num_of_dogs AS "numOfDogs",
                    preferred_gender AS "preferredGender",
                    preferred_age AS "preferredAge",
                    is_admin AS "isAdmin"
               `[
        username,
        hashedPassword,
        email,
        picture,
        description,
        privateOutdoors,
        numOfDogs,
        preferredGender,
        preferredAge,
        isAdmin
      ]
    );

    const adopter = result.rows[0];

    return adopter;
  }

  /**Find all adopters(optional filter on searchFilters)
   *
   * searchFilters (all optional):
   * -username (will find case-insensitive parital matches)
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
