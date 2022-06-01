## [Ktai-Petly](https://ktai-petly.surge.sh/)

Link: https://ktai-petly.surge.sh/

Description: 
Ktai-Petly is a resemblance of a two sided marketplace app. There are 2 sides of users, shelters and adopters. The adoptable pets on the site is dogs. Shelters can sign up and post their adoptable dogs. Adopters can sign up to view the adoptable dogs, and if they want to contact the shelter about a dog, they can send the shelter their message and contact info. The shelter will receive it as an email. 

## User Flow
![user flow](https://github.com/KKTTAAII/capstone-ll-frontend/blob/master/userFlow.jpg?raw=true)

## Main Features
 - user can log in/ sign up
-  logged in user can see dogs and shelters
-  user can update their profile
-  adopter user can favorite and unfavorite a dog
-  shelter user can add a dog
-  user can contact shelter
-  user can update their password
-  log out

## Schema

![Schema](https://github.com/KKTTAAII/capstone-ll-backend/blob/master/schema/updated%205.12.png?raw=true).

## Technologies used
- node.js
- express
- javascript
- react
- react router dom
- react-pagination
- swal
- fontawesome
- jwt
- axios
- reactstrap
- bcrypt
- jsonwebtoken
- nodemailer
- jsonschema
- postgresql

## Try the code on your local machine

1. create main folder for both frontend and backend repos
2. create an account with [PetFinder API](https://www.petfinder.com/developers/) to get API_KEY and SECRET_KEY
3. in the backend folder, create .env file to store the keys
4. create variables EMAIL(your email), PASS(password), HOST(your host smtp) for nodemailer so user can send messages to shelters
5. clone the backend repo
   
        $ git clone  https://github.com/KKTTAAII/capstone-ll-backend.git
6.  clone the backend repo
   
        $ git clone https://github.com/KKTTAAII/capstone-ll-frontend.git
7. run this command to install all packages for both front-end and back-end. Ensure to run in both backend and fronend folders
        
        $ npm install     
8. ensure you are in the main back-end folder, run the command below to start the app. This will start both backend and frontend servers
   
        $ npm run dev       

## Run tests
1. go to the folder where there are .test.js files
2. run a test by using this command

        $ jest FILE_NAME.test.js

## v2.0.0 - Future Features
- user can share the dog they want to adopt with their friends via social media

Author: [Boonyawee P.](https://www.linkedin.com/in/boonyawee-prasertsiripond/)       