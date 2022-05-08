"use strict";

/** Routes for shelters. */

const jsonschema = require("jsonschema");
const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const Shelter = require("../models/shelter");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const shelterSearchSchema = require("../jsonSchemas/shelter/shelterSearch.json");
const shelterUpdateSchema = require("../jsonSchemas/shelter/shelterUpdate.json");
const sendEmail = require("../utils/sendResetPasswordEmail");
const { createToken } = require("../helpers/tokens");

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

/**POST Forgot Password => email the user to reset password */
router.post("/forgotPassword", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError(errs);
    }
    const shelter = await Shelter.findAll({ email: email });
    const { username } = shelter[0];
    const resetPasswordToken = createToken(shelter[0], { expiresIn: "1h" });
    const host = req.get("host");
    const link = `http://${host}/shelters/resetForgotPassword/${username}?token=${resetPasswordToken}`;
    await sendEmail(shelter[0].email, "Password reset", link, username);
    res.send("password reset link sent to the email");
  } catch (err) {
    return next(err);
  }
});

/**POST reset password for forgot password case
 *
 * The user will have to put new a new password in the field
 *
 * password from req.body
 */
router.post("/resetForgotPassword/:username", async (req, res, next) => {
  try {
    const { token } = req.query;
    const { username } = req.params;
    const { password } = req.body;
    let user = jwt.verify(token, SECRET_KEY);
    //check if we have everything we need - password input, usernames matche, token
    if (user && user.username === username && password) {
      await Shelter.updatePassword(username, password);
      return res.json({ password: "Password reset successfully" });
    } else {
      throw new BadRequestError("Invalid or expired password reset token");
    }
  } catch (err) {
    return next(err);
  }
});

/**POST adopter emails shelter 
 * 
 * adopter info {email, message, name} = req.body
 * 
 */

module.exports = router;
