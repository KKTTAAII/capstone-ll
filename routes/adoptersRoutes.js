"use strict";

/** Routes for adopters. */

const jsonschema = require("jsonschema");
const express = require("express");

const Adopter = require("../models/adopter");
const { BadRequestError } = require("../expressError");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectAdopterOrAdmin,
} = require("../middleware/auth");
const adopterSearchSchema = require("../jsonSchemas/adopter/adopterSearch.json");
const adopterUpdateSchema = require("../jsonSchemas/adopter/adopterUpdate.json");
const getFavoritesDogsInfo = require("../helpers/getFavoriteDogs");

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
  try {
    const query = req.query;
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

/** GET /{req.params.username}  =>  { adopter }
 *
 *  adopter is { id, username, email, picture, description, privateOutdoors, numOfDogs, preferredGender, preferredAge, isAdmin }
 *   where favDogs is [{ name, breedId, gender, age, picture, description }, ...]
 *
 * Authorization required: Logged in
 */

router.get("/:username", ensureLoggedIn, async (req, res, next) => {
  try {
    const { username } = req.params;
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
 * email }
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

/** PATCH /{req.params.username} { fld1, fld2, ... } => { adopter }
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
  ensureCorrectAdopterOrAdmin,
  async (req, res, next) => {
    try {
      //no data mutate
      const isPrivateOutdoors = +req.body.privateOutdoors ? true : false;
      delete req.body.privateOutdoors;
      req.body.privateOutdoors = isPrivateOutdoors;
      const dogNum = +req.body.numOfDogs;
      delete req.body.numOfDogs;
      req.body.numOfDogs = dogNum;
      
      const validator = jsonschema.validate(req.body, adopterUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      const { username } = req.params;
      const adopter = await Adopter.update(username, req.body);
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
  ensureCorrectAdopterOrAdmin,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const { password } = req.body;
      if (!password) {
        throw new BadRequestError(errs);
      }
      const response = await Adopter.updatePassword(username, password);
      return res.json(response);
    } catch (err) {
      return next(err);
    }
  }
);

/**POST favorite a dog /[adoptablePetsId] => {favDog}
 *
 * Authorization: Logged in
 */
router.post(
  "/favoriteDog/:adoptablePetsId",
  ensureLoggedIn,
  async (req, res, next) => {
    try {
      const user = res.locals.user.username;
      const { adoptablePetsId } = req.params;
      const favDog = await Adopter.favorite(adoptablePetsId, user);
      return res.json({ favDog });
    } catch (err) {
      return next(err);
    }
  }
);

/**GET favorite dogs /[username] => [{favDog},...]
 *
 * Authorization: correctUser or admin
 */
router.get(
  "/favoriteDogs/:username",
  ensureCorrectAdopterOrAdmin,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const favoriteDogsResponse = await Adopter.getFavorites(username);
      const allFavoriteDogsIds = favoriteDogsResponse.map(
        obj => obj.adoptable_pets_id
      );
      const favoriteDogs = await getFavoritesDogsInfo(allFavoriteDogsIds);
      return res.json({ favoriteDogs });
    } catch (err) {
      return next(err);
    }
  }
);

/**DELETE favorite dog or unfavorite dog /[adoptablePetsId] => {favDog}{ delete: "Favorite Dog Deleted" }*
 *
 * Authorization: Logged in
 */
router.delete(
  "/unfavoriteDog/:adoptablePetsId",
  ensureLoggedIn,
  async (req, res, next) => {
    try {
      const user = res.locals.user.username;
      const { adoptablePetsId } = req.params;
      const unFavDog = await Adopter.unFavorite(adoptablePetsId, user);
      return res.json({ unFavDog });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

// version 2.0
// const jwt = require("jsonwebtoken");
// const { SECRET_KEY } = require("../config");
// const sendResetPasswordEmail = require("../utils/sendResetPasswordEmail");
// const { createToken } = require("../helpers/tokens");
// /**POST Forgot Password => email the user to reset password */
// router.post("/forgotPassword", async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       throw new BadRequestError(errs);
//     }
//     const adopter = await Adopter.findAll({ email: email });
//     const { username } = adopter[0];
//     const resetPasswordToken = createToken(adopter[0], { expiresIn: "1h" });
//     const host = req.get("host");
//     const link = `http://${host}/adopters/resetForgotPassword/${username}?token=${resetPasswordToken}`;
//     await sendResetPasswordEmail(
//       adopter[0].email,
//       "Password reset",
//       link,
//       username
//     );
//     res.send("password reset link sent to the email");
//   } catch (err) {
//     return next(err);
//   }
// });

// /**POST reset password for forgot password case
//  *
//  * The user will have to put new a new password in the field
//  *
//  * password from req.body
//  */
// router.post("/resetForgotPassword/:username", async (req, res, next) => {
//   try {
//     const { token } = req.query;
//     const { username } = req.params;
//     const { password } = req.body;
//     let user = jwt.verify(token, SECRET_KEY);
//     //check if we have everything we need - password input, usernames matche, token
//     if (user && user.username === username && password) {
//       await Adopter.updatePassword(username, password);
//       return res.json({ password: "Password reset successfully" });
//     } else {
//       throw new BadRequestError("Invalid or expired password reset token");
//     }
//   } catch (err) {
//     return next(err);
//   }
// });
