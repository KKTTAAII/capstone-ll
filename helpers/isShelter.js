const Shelter = require("../models/shelter");
const { UnauthorizedError } = require("../expressError");

/**function to check if the user is a shelter, not adopter
 *
 * If not, raises Unauthorized.
 */
async function isShelter(req, res) {
  const { userId } = req.params;
  const { username } = res.locals.user;
  const shelter = await Shelter.get(userId);
  if (username !== shelter.username) {
    throw new UnauthorizedError("unauthorized");
  } else {
    return true;
  }
}

module.exports = isShelter;
