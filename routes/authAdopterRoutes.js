"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const Adopter = require("../models/adopter");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const { BadRequestError } = require("../expressError");
const userAuthScema = require("../jsonSchemas/userAuth.json");
const authAdopterSchema = require("../jsonSchemas/adopter/registerAdopter.json");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAuthScema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const adopter = await Adopter.authenticate(username, password);
    const token = createToken(adopter);
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
    const validator = jsonschema.validate(req.body, authAdopterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newAdopter = await Adopter.register({ ...req.body, isAdmin: false });
    const token = createToken(newAdopter);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
