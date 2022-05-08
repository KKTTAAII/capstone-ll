"use strict";

/** Routes for adopters. */

const jsonschema = require("jsonschema");
const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const Adopter = require("../models/adopter");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const adopterSearchSchema = require("../jsonSchemas/adopter/adopterSearch.json");
const adopterUpdateSchema = require("../jsonSchemas/adopter/adopterUpdate.json");
const sendEmail = require("../utils/sendEmail");
const { createToken } = require("../helpers/tokens");

const router = new express.Router();

/** GET /  =>
 *   { adopters: [ {username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge, isAdmin}, ...] }
 *
 * Can filter on provided search filters:
 * -username
 *
 * Authorization required: Logged in
 */
router.get("/", ensureLoggedIn, async (req, res, next) => {
  const query = req.query;
  try {
    const validator = jsonschema.validate(query, adopterSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const adopters = await Adopter.findAll(query);
    return res.json({ adopters });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username]  =>  { adopter }
 *
 *  adopter is { username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge, isAdmin }
 *   where favDogs is [{ name, breedId, gender, age, picture, description }, ...]
 *
 * Authorization required: Logged in
 */

router.get("/:username", ensureLoggedIn, async (req, res, next) => {
  const { username } = req.params;
  try {
    const adopter = await Adopter.get(username);
    return res.json({ adopter });
  } catch (err) {
    return next(err);
  }
});

/** POST / { adopter } =>  { adopter }
 *
 * adopter should be {
 * username,
 * password,
 * email,
 * picture(optional),
 * description,
 * privateOutdoors,
 * numOfDogs,
 * preferredGender,
 * preferredAge,
 * isAdmin }
 *
 * Returns { username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge, isAdmin }
 *
 * Authorization required: admin
 */
router.post("/", ensureAdmin, async (req, res, next) => {
  try {
    const newAdopter = await Adopter.register({ ...req.body, isAdmin: false });
    return res.status(201).json({ newAdopter });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[username] { fld1, fld2, ... } => { adopter }
 *
 * Patches adopter data.
 *
 * fields can be: { username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge}
 *
 * Returns { username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge }
 *
 * Authorization required: correctuser or admin
 */

router.patch(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, adopterUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const adopter = await Adopter.update(req.params.username, req.body);
      return res.json({ adopter });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: adopter }
 *
 * Authorization: admin
 */
router.delete("/:username", ensureAdmin, async (req, res, next) => {
  try {
    const { username } = req.params;
    const deleted = await Adopter.remove(username);
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
      await Adopter.updatePassword(username, password);
      return res.json({ password: "Password reset successfully" });
    } catch (err) {
      return next(err);
    }
  }
);

/**POST favorite a dog /[adoptablePetsId] => {favDog}
 *
 * Authorization: correctUser or admin
 */
router.post(
  "/favDog/:adoptablePetsId",
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const user = res.locals.user.username;
      const { adoptablePetsId } = req.params;
      const favDog = await Adopter.favorite(adoptablePetsId, user);
      return res.json(favDog);
    } catch (err) {
      return next(err);
    }
  }
);

/**DELETE favorite dog or unfavorite dog /[adoptablePetsId] => {favDog}{ delete: "Favorite Dog Deleted" }*
 *
 * Authorization: correctUser or admin
 */
router.delete(
  "/unfavDog/:adoptablePetsId",
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const user = res.locals.user.username;
      const { adoptablePetsId } = req.params;
      const unFavDog = await Adopter.unFavorite(adoptablePetsId, user);
      return res.json(unFavDog);
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
    const adopter = await Adopter.findAll({ email: email });
    const { username } = adopter[0];
    const resetPasswordToken = createToken(adopter[0], { expiresIn: "1h" });
    const host = req.get("host");
    const link = `http://${host}/adopters/resetForgotPassword/${username}?token=${resetPasswordToken}`;
    await sendEmail(adopter[0].email, "Password reset", link, username);
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
      await Adopter.updatePassword(username, password);
      return res.json({ password: "Password reset successfully" });
    } else {
      throw new BadRequestError("Invalid or expired password reset token");
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
