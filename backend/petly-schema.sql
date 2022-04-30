CREATE TABLE "shelters" (
    "id" serial PRIMARY KEY,
    "username" VARCHAR(25) NOT NULL UNIQUE,
    "password" text NOT NULL,
    "name" text NOT NULL,
    "address" text NOT NULL,
    "city" text NOT NULL,
    "state" text NOT NULL,
    "postcode" text NOT NULL,
    "phone_number" text NOT NULL,
    "email" text NOT NULL,
    "logo" text NULL,
    "description" text NULL

);

CREATE TABLE "shelters_adoptable_dogs" (
    "id" serial PRIMARY KEY UNIQUE,
    "shelter_id" int NOT NULL,
    "adoptable_dogs_id" int NOT NULL
);

CREATE TABLE "adoptable_dogs" (
    "id" serial PRIMARY KEY UNIQUE,
    "name" text NOT NULL,
    "breed_id" int NOT NULL,
    "gender" text NOT NULL,
    "age" text NOT NULL,
    "picture" text NOT NULL,
    "description" text NULL,
    "days_at_shelter" int  NULL,
    "good_w_kids" boolean NULL,
    "good_w_dogs" boolean NULL,
    "good_w_cats" boolean NULL
);

CREATE TABLE "adopters" (
    "id" serial PRIMARY KEY UNIQUE,
    "username" VARCHAR(25) NOT NULL UNIQUE,
    "password" text NOT NULL,
    "description" text NOT NULL,
    "private_outdoors" boolean NOT NULL,
    "num_of_dogs" int NOT NULL,
    "preferred_gender" text  NULL,
    "preferred_age" text  NULL 
);

CREATE TABLE "breed" (
    "id" serial PRIMARY KEY UNIQUE,
    "breed" text  NOT NULL 
);

CREATE TABLE "fav_dogs" (
    "id" serial PRIMARY KEY,
    "adopters_id" int NOT NULL,
    "adoptable_pets_id" int NOT NULL 
);

ALTER TABLE shelters_adoptable_dogs ADD CONSTRAINT fk_shelters_adoptable_dogs_shelter_id FOREIGN KEY(shelter_id)
REFERENCES shelters (id);

ALTER TABLE shelters_adoptable_dogs ADD CONSTRAINT fk_shelters_adoptable_dogs_adopatble_dogs_id FOREIGN KEY(adoptable_dogs_id)
REFERENCES adoptable_dogs (id);

ALTER TABLE adoptable_dogs ADD CONSTRAINT fk_adoptable_dogs_breed_id FOREIGN KEY(breed_id)
REFERENCES breed (id);

ALTER TABLE fav_dogs ADD CONSTRAINT fk_fav_dogs_adopters_id FOREIGN KEY(adopters_id)
REFERENCES adopters (id);

ALTER TABLE fav_dogs ADD CONSTRAINT fk_fav_dogs_adoptable_pets_id FOREIGN KEY(adoptable_pets_id)
REFERENCES adoptable_dogs (id);

