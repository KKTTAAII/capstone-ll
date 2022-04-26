CREATE TABLE `Shelters` (
    `id` SERIAL PRIMARY KEY,
    `username` VARCHAR(25) NOT NULL,
    `password` password NOT NULL,
    `name` text NOT NULL,
    `address` text NOT NULL,
    `phone_number` int NOT NULL,
    `logo` text NULL,
    `description` text NOT NULL,
    `adoptable_pets_id` [int] NOT NULL 
);

CREATE TABLE `Adoptable_dogs` (
    `id` SERIAL PRIMARY KEY,
    `name` text NOT NULL,
    `breed_id` [int] NOT NULL,
    `gender` text NOT NULL,
    `age` text NOT NULL,
    `picture` text NOT NULL,
    `description` text NOT NULL,
    `days_at_shelter` int  NULL,
    `good_w_kids` boolean NOT NULL,
    `good_w_dogs` boolean NOT NULL,
    `good_w_cats` boolean NOT NULL 
);
CREATE TABLE `Adopters` (
    `id` SERIAL PRIMARY KEY,
    `username` text NOT NULL,
    `password` password NOT NULL,
    `description` text NOT NULL,
    `private_outdoors` boolean NOT NULL,
    `num_of_dogs` int NOT NULL,
    `preferred_gender` text  NULL,
    `preferred_age` text  NULL 
);

CREATE TABLE `Breed` (
    `id` SERIAL PRIMARY KEY,
    `breed` text  NOT NULL 
);

CREATE TABLE `Fav_dogs` (
    `id` SERIAL PRIMARY KEY,
    `adopters_id` int NOT NULL,
    `adoptable_pets_id` int NOT NULL 
);

ALTER TABLE `Adoptable_dogs` ADD CONSTRAINT `fk_Adoptable_dogs_id` FOREIGN KEY(`id`)
REFERENCES `Shelters` (`adoptable_pets_id`);

ALTER TABLE `Adoptable_dogs` ADD CONSTRAINT `fk_Adoptable_dogs_breed_id` FOREIGN KEY(`breed_id`)
REFERENCES `Breed` (`id`);

ALTER TABLE `Fav_dogs` ADD CONSTRAINT `fk_Fav_dogs_adopters_id` FOREIGN KEY(`adopters_id`)
REFERENCES `Adopters` (`id`);

ALTER TABLE `Fav_dogs` ADD CONSTRAINT `fk_Fav_dogs_adoptable_pets_id` FOREIGN KEY(`adoptable_pets_id`)
REFERENCES `Adoptable_dogs` (`id`);

