"use strict";

const db = require("../db");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const Adopter = require("./adopter");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);
const adopter = {
  username: "moomoo",
  password: "helloworld",
  email: "moomoo@gmail.com",
  picture: "",
  description: "",
  privateOutdoors: true,
  numOfDogs: 0,
  preferredGender: "Male",
  preferredAge: "Young",
  isAdmin: false,
};

describe("create", () => {
  test("create an adopter", async () => {
    const newAdopter = await Adopter.register(adopter);

    expect(newAdopter).toEqual({
      username: "moomoo",
      email: "moomoo@gmail.com",
      picture: "",
      description: "",
      privateOutdoors: true,
      numOfDogs: 0,
      preferredGender: "Male",
      preferredAge: "Young",
      isAdmin: false,
      id: newAdopter.id,
    });
  });

  test("duplicate adopter", async () => {
    try {
      await Adopter.register(adopter);
      await Adopter.register(adopter);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("authenticate", () => {
  test("authenticate an adopter", async () => {
    await Adopter.register(adopter);
    const auhtenticatedAdopter = await Adopter.authenticate(
      "moomoo",
      "helloworld"
    );
    expect(auhtenticatedAdopter).toEqual({
      id: auhtenticatedAdopter.id,
      username: "moomoo",
      email: "moomoo@gmail.com",
      isAdmin: false,
    });
  });

  test("does not pass authentication", async () => {
    try {
      await Adopter.authenticate("moomoo", "helloworld3454");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

describe("find all", () => {
  test("find result", async () => {
    const adopters = await Adopter.findAll({ username: "cbein2" });
    expect(adopters.length).toEqual(1);
  });

  test("No result found", async () => {
    const adopters = await Adopter.findAll({ username: "shelterhyjtukrk" });
    expect(adopters).toEqual(undefined);
  });
});

describe("find a adopter", () => {
  test("find the adopter", async () => {
    const addedAdopter = await Adopter.register(adopter);
    const foundAdopter = await Adopter.get("moomoo");
    expect(foundAdopter).toEqual({ ...addedAdopter, favDogs: [] });
  });

  test("not find the adopter", async () => {
    try {
      await Adopter.get("moomoogregreh");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("update", () => {
  test("update a adopter", async () => {
    const addedAdopter = await Adopter.register(adopter);
    const updatedAdopter = await Adopter.update(addedAdopter.username, {
      username: "Updated Adopter",
    });
    expect(updatedAdopter.username).toEqual("Updated Adopter");
  });

  test("not find the adopter", async () => {
    try {
      await Adopter.update("vbjhbjk", {
        username: "Updated Adopter",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("remove", () => {
  test("remove a adopter", async () => {
    const addedAdopter = await Adopter.register(adopter);
    const removedAdopter = await Adopter.remove(addedAdopter.username);
    expect(removedAdopter).toEqual({ delete: "Adopter Deleted" });
  });

  test("not find the adopter", async () => {
    try {
      await Adopter.remove("rhrthtrh");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("update password", () => {
  test("update password succesfully", async () => {
    const addedAdopter = await Adopter.register(adopter);
    const updatedPasswordAdopter = await Adopter.updatePassword(
      addedAdopter.username,
      "updatedPassword"
    );
    expect(updatedPasswordAdopter).toEqual({
      updatePassword: "Password updated sucessfully",
    });
  });

  test("not find the adopter", async () => {
    try {
      await Adopter.updatePassword("rhrthtrh", "updatedPassword");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("favorite", () => {
  test("favorite a dog", async () => {
    const dog = await db.query(
      `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
    );
    const addedAdopter = await Adopter.register(adopter);
    const favoritedDog = await Adopter.favorite(
      dog.rows[0].id,
      addedAdopter.username
    );
    expect(favoritedDog).toEqual({
      adopters_id: addedAdopter.id,
      adoptable_pets_id: dog.rows[0].id,
    });
  });

  test("not find the adopter", async () => {
    try {
      const dog = await db.query(
        `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
      );
      await Adopter.favorite(dog.rows[0].id, "gtrhtrh");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("cannot favorite the same dog", async () => {
    try {
      const dog = await db.query(
        `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
      );
      const addedAdopter = await Adopter.register(adopter);
      await Adopter.favorite(dog.rows[0].id, addedAdopter.username);
      await Adopter.favorite(dog.rows[0].id, addedAdopter.username);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("unfavorite", () => {
  test("unfavorite a dog", async () => {
    const dog = await db.query(
      `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
    );
    const addedAdopter = await Adopter.register(adopter);
    await Adopter.favorite(dog.rows[0].id, addedAdopter.username);
    const unfavoritedDog = await Adopter.unFavorite(
      dog.rows[0].id,
      addedAdopter.username
    );
    expect(unfavoritedDog).toEqual({ delete: "Favorite Dog Deleted" });
  });

  test("not find the adopter", async () => {
    try {
      const dog = await db.query(
        `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
      );
      await Adopter.unFavorite(dog.rows[0].id, "gtrhtrh");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("no favorited dog with the id", async () => {
    try {
      const addedAdopter = await Adopter.register(adopter);
      await Adopter.unFavorite(4253, addedAdopter.username);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("get favorite", () => {
  test("get favorite dog", async () => {
    const dog = await db.query(
      `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
    );
    const addedAdopter = await Adopter.register(adopter);
    await Adopter.favorite(dog.rows[0].id, addedAdopter.username);
    const allFavoriteDogs = await Adopter.getFavorites(addedAdopter.username);
    expect(allFavoriteDogs.length).toEqual(1);
  });

  test("not find the adopter", async () => {
    try {
      const dog = await db.query(
        `SELECT id FROM adoptable_dogs WHERE name = 'Choco'`
      );
      await Adopter.getFavorites("gtrhtrh");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
