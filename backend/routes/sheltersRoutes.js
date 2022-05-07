"use strict";

/** Routes for shelters. */

const jsonschema = require("jsonschema");
const express = require("express");

const Shelter = require("../models/shelter");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const shelterSearchSchema = require("../jsonSchemas/shelter/shelterSearch.json");
const shelterUpdateSchema = require("../jsonSchemas/shelter/shelterUpdate.json");

const router = new express.Router();

/** GET /  =>
 *   { shelters: [ {username, name, email, phoneNumber, city, state, description, logo, isAdmin}, ...] }
 *
 * Can filter on provided search filters:
 * -name (will find case-insensitive parital matches)
 * -city
 * -state
 *
 * Authorization required: Logged in
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  const query = req.query;
  try {
    const validator = jsonschema.validate(query, shelterSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const shelters = await Shelter.findAll(query);
    return res.json({ shelters });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username]  =>  { shelter }
 *
 *  shelter is { username, name, email, phoneNumber, city, state, description, logo, isAdmin }
 *   where adoptable_dogs is [{ name, breedId, gender, age, picture, description }, ...]
 *
 * Authorization required: logged in
 */

router.get("/:username", ensureLoggedIn, async (req, res, next) => {
  const { username } = req.params;
  try {
    const shelter = await Shelter.get(username);
    return res.json({ shelter });
  } catch (err) {
    return next(err);
  }
});

/** POST / { shelter } =>  { shelter }
 *
 * shelter should be { username, password, name, address (optional), city, state, postcode (optional), phoneNumber, email, logo (optional), description (optional)
 * }
 *
 * Returns { username, password, name, address, city, state, postcode, phoneNumber, email, logo, description, isAdmin }
 *
 * Authorization required: admin
 */
router.post("/", ensureAdmin, async (req, res, next) => {
  try {
    const newShelter = await Shelter.register({ ...req.body, isAdmin: false });
    console.log(newShelter);
    return res.status(201).json({ newShelter });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[username] { fld1, fld2, ... } => { shelter }
 *
 * Patches shelter data.
 *
 * fields can be: { name, address, city, state, postcode, phoneNumber, email, logo, description
        }
 *
 * Returns { username, name, address, city, state, postcode, phoneNumber, email, logo, description, isAdmin }
 *
 * Authorization required: correctuser or admin
 */

router.patch(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, shelterUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const shelter = await Shelter.update(req.params.username, req.body);
      return res.json({ shelter });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: shelter }
 *
 * Authorization: admin
 */
router.delete("/:username", ensureAdmin, async (req, res, next) => {
  try {
    const { username } = req.params;
    const deleted = await Shelter.remove(username);
    return res.json(deleted);
  } catch (err) {
    return next(err);
  }
});

/**PATH UPDATE PASSWORD /[username] =>  { updatedPassword: response }
 *
 * Authorization: correctUser or admin
 */
router.patch(
  "/resetPassword/:username",
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const { password } = req.body;
      if (!password) {
        throw new BadRequestError(errs);
      }
      const response = await Shelter.updatePassword(username, password);
      return res.json(response);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
