"use strict";

/** Routes for authentication. */
const jsonschema = require("jsonschema");
const Adopter = require("../models/adopter");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const { BadRequestError } = require("../expressError");
const userAuthSchema = require("../jsonSchemas/userAuth.json");
const authAdopterSchema = require("../jsonSchemas/adopter/registerAdopter.json");
const cloudinary = require("../utils/cloudinary");

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
    const adopter = await Adopter.authenticate(username, password);
    adopter.userType = "adopters";
    const token = createToken(adopter);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/**GET /auth/authenticate: { username, password }
 *
 * Authorization required: none
 */
router.post("/authenticate", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const adopter = await Adopter.authenticate(username, password);
    return res.json({ adopter });
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
    //adjusts the data to ensure it is compatible with our jsonSchema requirements
    let copiedReqBody = JSON.parse(JSON.stringify(req.body));
    copiedReqBody.privateOutdoors = +req.body.privateOutdoors ? true : false;
    copiedReqBody.numOfDogs = +req.body.numOfDogs;

    if (req.body.picture) {
      const uploadRes = await cloudinary.uploader.upload(req.body.picture, {
        upload_preset: "petly",
      });
      if (uploadRes) {
        copiedReqBody.picture = uploadRes;
      }
    }

    const validator = jsonschema.validate(copiedReqBody, authAdopterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newAdopter = await Adopter.register({
      ...copiedReqBody,
      isAdmin: req.body.isAdmin ? req.body.isAdmin : false,
    });
    newAdopter.userType = "adopters";
    const token = createToken(newAdopter);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
