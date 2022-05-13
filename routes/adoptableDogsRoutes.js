"use strict";

/** Routes for shelters. */

const jsonschema = require("jsonschema");
const express = require("express");

const AdoptableDog = require("../models/adoptableDog");
const { BadRequestError } = require("../expressError");
const {
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const adoptableDogSearchSchema = require("../jsonSchemas/adoptableDog/adoptableDogSearch.json");
const adoptableDogUpdateSchema = require("../jsonSchemas/adoptableDog/adoptableDogUpdate.json");
const newDogSchema = require("../jsonSchemas/adoptableDog/newAdoptableDog.json");
const { getDogs, getDog } = require("../helpers/getDogs");
const Shelter = require("../models/shelter");

const router = new express.Router();

/** GET /  =>
 *   { adoptableDogs: [ {id,name,
 * breed_id,
 * gender,
 * age,
 * picture,
 * description,
 * daysAtShelter,
 * goodWKids,
 * goodWDogs,
 * goodWCcats,
 * shelterId}, ...] }
 *
 * Can filter on provided search filters:
 * -name (will find case-insensitive parital matches)
 * -city
 * -state
 * -postcode
 *
 * Authorization required: Logged in
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  const query = req.query;
  try {
    const validator = jsonschema.validate(query, adoptableDogSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const petFinderDogs = await getDogs(query);
    const adoptableDogs = await AdoptableDog.findAll(query);
    if (petFinderDogs[0]) {
      adoptableDogs.push(...petFinderDogs);
    }
    return res.json({ adoptableDogs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { adoptableDog }
 *
 *  adoptableDog is [{ id,
 * name,
 * breedId,
 * gender,
 * age,
 * picture,
 * description,
 * goodWKids,
 * goodWDogs,
 * goodWCcats,
 * shelterId },...]
 *
 *
 * Authorization required: logged in
 */

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    let adoptableDog = [];
    let dbResponse = await AdoptableDog.get(+id);
    let petFinderresponse = await getDog(+id);
    if (dbResponse !== null) {
      adoptableDog.push(dbResponse);
    }
    if (petFinderresponse !== null) {
      adoptableDog.push(petFinderresponse);
    }
    return res.json({ adoptableDog });
  } catch (err) {
    return next(err);
  }
});

/** POST / { adoptableDog } =>  { adoptableDog }
 *
 * adoptableDog should be {name, breed_id, gender, age, picture, description, goodWKids, goodWDogs, goodWCcats, shelterId}
 *
 *
 * Returns {id, name, breedId, gender, age, picture, description, goodWKids, goodWDogs, goodWCcats, shelterId}
 *
 * Authorization required: correctUser or admin
 */
router.post("/:id", ensureCorrectUserOrAdmin, async (req, res, next) => {
  const query = req.body;
  try {
    const validator = jsonschema.validate(query, newDogSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const { id } = req.params;
    const shelter = await Shelter.get(id);
    const newAdoptableDog = await AdoptableDog.create({
      ...query,
      shelterId: shelter.id,
    });
    return res.status(201).json({ newAdoptableDog });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { adoptableDog }
 *
 * Patches adoptableDog data.
 *
 * fields can be: { name, breed_id, gender, age, picture, description, goodWKids, goodWDogs, goodWCats }
 *
 * Returns {id, name, breed_id, gender, age, picture, description, goodWKids, goodWDogs, goodWCats}
 *
 * Authorization required: correctuser or admin
 */
router.patch(
  "/:id/:dogId",
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, adoptableDogUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const { dogId } = req.params;
      const adoptableDog = await AdoptableDog.update(dogId, req.body);
      return res.json({ adoptableDog });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /id  =>  { deleted: "Adoptable dog Deleted" }
 *
 * Authorization: correctUser or admin
 */
router.delete("/:id/:dogId", ensureCorrectUserOrAdmin, async (req, res, next) => {
  try {
    const { dogId } = req.params;
    const deleted = await AdoptableDog.remove(dogId);
    return res.json(deleted);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
