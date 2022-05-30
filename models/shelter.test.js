"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");
const Shelter = require("./shelter");
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
const newShelter = {
  username: "ktai",
  password: "helloworld",
  name: "shelter Ktai",
  email: "helloworld@gmail.com",
  phoneNumber: "975842156",
  address: "",
  state: "CO",
  city: "breck",
  postcode: "",
  logo: "",
  description: "",
  isAdmin: false,
};

/**************************create */

describe("create", () => {
  test("create a new shelter", async () => {
    const shelter = await Shelter.register(newShelter);
    expect(shelter).toEqual({
      id: shelter.id,
      username: "ktai",
      name: "shelter Ktai",
      email: "helloworld@gmail.com",
      phoneNumber: "975842156",
      address: "",
      state: "CO",
      city: "breck",
      postcode: "",
      logo: "",
      description: "",
      isAdmin: false,
    });
  });

  test("duplicate shelter", async () => {
    try {
      await Shelter.register(newShelter);
      await Shelter.register(newShelter);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("authenticate", () => {
  test("pass authentication", async () => {
    const shelter = await Shelter.authenticate("shelter1", "password1");
    expect(shelter).toEqual({
      id: shelter.id,
      username: "shelter1",
      name: "shelterOne",
      email: "shelter1@hello.com",
      isAdmin: false,
    });
  });

  test("does not pass authentication", async () => {
    try {
      await Shelter.authenticate("shelter1", "password");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

describe("find all", () => {
  test("find result", async () => {
    const shelters = await Shelter.findAll({ name: "shelter" });
    expect(shelters.length).toEqual(3);
  });

  test("No result found", async () => {
    const shelters = await Shelter.findAll({ name: "shelterhyjtukrk" });
    expect(shelters).toEqual(undefined);
  });
});

describe("find a shelter", () => {
  test("find the shelter", async () => {
    const addedShelter = await Shelter.register(newShelter);
    const shelter = await Shelter.get(addedShelter.id);
    expect(shelter).toEqual({ ...addedShelter, adoptableDogs: null });
  });

  test("not find the shelter", async () => {
    try {
      await Shelter.get(58979);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("update", () => {
  test("update a shelter", async () => {
    const addedShelter = await Shelter.register(newShelter);
    const updatedShelter = await Shelter.update(addedShelter.id, {
      name: "Updated Shelter",
    });
    expect(updatedShelter.name).toEqual("Updated Shelter");
  });

  test("not find the shelter", async () => {
    try {
      await Shelter.get(58979);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("remove", () => {
  test("remove a shelter", async () => {
    const addedShelter = await Shelter.register(newShelter);
    const removedShelter = await Shelter.remove(addedShelter.id);
    expect(removedShelter).toEqual({ delete: "Shelter Deleted" });
  });

  test("not find the shelter", async () => {
    try {
      await Shelter.get(58979);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("update password", () => {
  test("update password succesfully", async () => {
    const addedShelter = await Shelter.register(newShelter);
    const updatedPasswordShelter = await Shelter.updatePassword(
      addedShelter.id,
      "updatedPassword"
    );
    expect(updatedPasswordShelter).toEqual({
      updatePassword: "Password updated sucessfully",
    });
  });

  test("not find the shelter", async () => {
    try {
      await Shelter.get(58979);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
