"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const Shelter = require("../models/shelter");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const { BadRequestError } = require("../expressError");
const userAuthSchema = require("../jsonSchemas/userAuth.json");
const authShelterSchema = require("../jsonSchemas/shelter/registerShelter.json");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const shelter = await Shelter.authenticate(username, password);
    shelter.userType = "shelters"
    const token = createToken(shelter);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, name, city, state, phoneNumber, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, authShelterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newShelter = await Shelter.register({ ...req.body, isAdmin: false });
    newShelter.userType = "shelters";
    const token = createToken(newShelter);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
