CREATE TABLE "shelters" (
    "id" serial   NULL,
    "username" VARCHAR(25)   NOT NULL,
    "password" text   NOT NULL,
    "name" text   NOT NULL,
    "address" text   NOT NULL,
    "city" text   NOT NULL,
    "state" text   NOT NULL,
    "postcode" text   NOT NULL,
    "phone_number" text   NOT NULL,
    "email" text   NOT NULL,
    "logo" text   NULL,
    "description" text   NULL,
    "is_admin" boolean   NOT NULL DEFAULT FALSE
);

CREATE TABLE "adoptable_dogs" (
    "id" serial   NULL,
    "name" text   NOT NULL,
    "breed_id" int   NOT NULL,
    "gender" text   NOT NULL,
    "age" text   NOT NULL,
    "picture" text   NOT NULL,
    "description" text   NOT NULL,
    "days_at_shelter" int   NULL,
    "good_w_kids" boolean   NULL,
    "good_w_dogs" boolean   NULL,
    "good_w_cats" boolean   NULL,
    "shelter_id" int   NOT NULL
);

CREATE TABLE "adopters" (
    "id" serial   NULL,
    "username" VARCHAR(25)   NOT NULL,
    "password" text   NOT NULL,
    "description" text   NOT NULL,
    "private_outdoors" boolean   NOT NULL,
    "num_of_dogs" int   NOT NULL,
    "preferred_gender" text   NULL,
    "preferred_age" text   NULL,
    "is_admin" boolean   NOT NULL DEFAULT FALSE
);

CREATE TABLE "breed" (
    "id" serial   NULL,
    "breed" text   NOT NULL
);

CREATE TABLE "fav_dogs" (
    "id" serial   NULL,
    "adopters_id" int   NOT NULL,
    "adoptable_pets_id" int   NOT NULL
);

ALTER TABLE "adoptable_dogs" ADD CONSTRAINT "fk_adoptable_dogs_breed_id" FOREIGN KEY("breed_id")
REFERENCES "breed" ("id");

ALTER TABLE "adoptable_dogs" ADD CONSTRAINT "fk_adoptable_dogs_shelter_id" FOREIGN KEY("shelter_id")
REFERENCES "shelters" ("id");

ALTER TABLE "fav_dogs" ADD CONSTRAINT "fk_fav_dogs_adopters_id" FOREIGN KEY("adopters_id")
REFERENCES "adopters" ("id");

ALTER TABLE "fav_dogs" ADD CONSTRAINT "fk_fav_dogs_adoptable_pets_id" FOREIGN KEY("adoptable_pets_id")
REFERENCES "adoptable_dogs" ("id");

