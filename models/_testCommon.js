const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM shelters");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM adoptable_dogs");

  //   await db.query(
  //     `INSERT INTO breed(breed)
  //       VALUES ('good dog'),
  //       ('better dog'),
  //       ('best dog')`
  //   );

  await db.query(
    `INSERT INTO shelters(username, password, name, address, city, state, postcode, phone_number, email, logo, description)
    VALUES ('shelter1', $1, 'shelterOne', 'Breck1', 'breck', 'CO', '80424', '8547569654', 'shelter1@hello.com', '', 'i love dogs'),
    ('shelter2', $2, 'shelterTwo', 'Breck2', 'breck', 'CO', '80424', '4563217852', 'shelter2@hello.com', '', ''),
    ('shelter3', $3, 'shelterThree', 'Breck3', 'breck', 'CO', '80424', '4123574521', 'shelter3@hello.com', '', 'I love animals')`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password3", BCRYPT_WORK_FACTOR),
    ]
  );

  //   await db.query(
  //     `INSERT INTO adoptable_dogs(name, breed_id, gender, age, picture, description, good_w_kids, good_w_dogs, good_w_cats, shelter_id)
  //     VALUES ('Choco', 1, 'Male', 'Young', 'https://dl5zpyw5k3jeb.cloudfront.net/photos/pets/55194486/1/?bust=1648996693&width=100',
  //     'Hi there!!  My name is Choco and I am a 1 year old, Husky X.  I am already a big...', true, true, null, 1),
  //     ('German Shepherd Mix PUPPIES!!!', 2, 'Female', 'Baby', 'https://dl5zpyw5k3jeb.cloudfront.net/photos/pets/55005728/1/?bust=1647480729&width=100',
  //     'Our rescue was alerted to a sweet, young, female German Shepherd that was lying on the side of a county...', true, true, true, 2),
  //     ('Alfie', 3, 'Male', 'Young', 'https://dl5zpyw5k3jeb.cloudfront.net/photos/pets/55367212/1/?bust=1650641371&width=100',
  //     'Meet Alfie! Alfie is a 28 lb, one year old Beagle found as a stray in a creek. He has...', null, true, null, 3)`
  //   );
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};
