"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");
const AdoptableDog = require("./adoptableDog");
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

const getNewAdoptableDog = async () => {
  const goodDogId = await db.query(
    `SELECT id FROM breed WHERE breed = 'good dog'`
  );
  const shelter1 = await db.query(
    `SELECT id FROM shelters WHERE username = 'shelter1'`
  );
  const newAdoptableDog = {
    name: "Evie",
    breedId: goodDogId.rows[0].id,
    gender: "Female",
    age: "Young",
    picture: "",
    description: "",
    goodWKids: true,
    goodWDogs: true,
    goodWCats: false,
    shelterId: shelter1.rows[0].id,
  };
  return newAdoptableDog;
};

describe("create", () => {
  test("create a dog", async () => {
    const newAdoptableDog = await getNewAdoptableDog();
    const newDog = await AdoptableDog.create(newAdoptableDog);
    expect(newDog).toEqual({ ...newAdoptableDog, id: newDog.id });
  });
});

describe("find all dogs", () => {
  test("find dogs with gender", async () => {
    const dogs = await AdoptableDog.findAll({ gender: "Male" });
    expect(dogs.length).toEqual(2);
  });

  test("find dogs age", async () => {
    const dogs = await AdoptableDog.findAll({ age: "Baby" });
    expect(dogs.length).toEqual(1);
  });

  test("not found", async () => {
    const dogs = await AdoptableDog.findAll({ age: "Adult" });
    expect(dogs).toEqual(undefined);
  });
});

describe("find a dog", () => {
  test("find the dog", async () => {
    const goodDogBreed = await db.query(
      `SELECT breed FROM breed WHERE breed = 'good dog'`
    );
    const shelter1 = await db.query(
      `SELECT id,
            name,
            address,
            city,
            state,
            postcode,
            phone_number AS "phoneNumber",
            email,
            logo,
            description
        FROM shelters
        WHERE username = 'shelter1'`
    );

    const newAdoptableDog = await getNewAdoptableDog();
    const newDog = await AdoptableDog.create(newAdoptableDog);
    const dog = await AdoptableDog.get(newDog.id);
    expect(dog).toEqual({
      ...newAdoptableDog,
      id: newDog.id,
      breed: goodDogBreed.rows[0].breed,
      shelter: shelter1.rows[0],
    });
  });

  test("not found", async () => {
    const dog = await AdoptableDog.get(52478);
    expect(dog).toEqual(null);
  });
});

describe("update", () => {
  test("update a dog", async () => {
    const newAdoptableDog = await getNewAdoptableDog();
    const newDog = await AdoptableDog.create(newAdoptableDog);
    const updatedDog = await AdoptableDog.update(newDog.id, {
      name: "EvieTheCutie",
    });
    expect(updatedDog.name).toEqual("EvieTheCutie");
  });

  test("not found", async () => {
    try {
      const updatedDog = await AdoptableDog.update(52364, {
        name: "EvieTheCutie",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("remove", () => {
  test("update a dog", async () => {
    const newAdoptableDog = await getNewAdoptableDog();
    const newDog = await AdoptableDog.create(newAdoptableDog);
    const removedDog = await AdoptableDog.remove(newDog.id);
    expect(removedDog).toEqual({ delete: "Adoptable dog Deleted" });
  });

  test("not found", async () => {
    try {
      const updatedDog = await AdoptableDog.remove(52364);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
