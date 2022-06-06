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
- [PetFinder API](https://www.petfinder.com/developers/v2/docs/)

## Try the code on your local machine

1. create main folder for both frontend and backend repos
2. create an account with [PetFinder API](https://www.petfinder.com/developers/) to get API_KEY and SECRET_KEY
3. in the backend folder, create .env file to store the keys
4. create variables EMAIL(your email), PASS(password), HOST(your host smtp) for nodemailer so user can send messages to shelters. Store these in .env file
5. clone the backend repo
   
        $ git clone  https://github.com/KKTTAAII/capstone-ll-backend.git
6.  clone the frontend repo
   
        $ git clone https://github.com/KKTTAAII/capstone-ll-frontend.git
7. run this command to install all packages for both frontend and backend. Ensure to run in both backend and fronend folders
        
        $ npm install     
8. ensure you are in the main backend folder, run the command below to start the app. This will start both backend and frontend servers
   
        $ npm run dev       

## Run tests
- For backend
1. go to the folder where there are .test.js files
2. run a test by using this command

        $ jest FILE_NAME.test.js
- For frontend
1. ensure you are inside the frontend folder
2. run tests by using this command

        $ npm test
3. you can be specific as what file you want by specifying the file name

        $npm test FILE_NAME.test.js

## v2.0.0 - Future Features
- user can share the dog they want to adopt with their friends via social media
- user can upload their picture from their local machine. To do this effectively, a third party image storage API will need to be used (S3, Cloudinary, etc). After receiving the picture file form the frontend form, that file needs to be transaformed into an image path using the third party API. Once a path from the third party is received, it can be stored in the database. When a user logs in next time, the path can be pull from the data base to put in the <img /> in the src attribute
- fix the reactstrap jest test issue by replacing it with CSS
- To save the number of requests for when a user favorites/unfavorites a dog:
  - 1. Every time a user favorites a dog, add the dog into a local storage. If they unfavorite or favorite that dog again, the data is already in the localStorage, so, it can be pulled from there to display in the "My Favorites" page, instead of, calling the API again. However, this will not persist across all users. Therefore, there is number 2 option
  - 2. Get all the favorited dogs from the database table name "fav_dogs", call all the dogs in there at once and save them in a global variable (can do useRef), then we can check if the user favorite a dog that is in that variable so we do not have to call the API. This will be for all users and we get the freshest data from Petfinder API


Author: [Boonyawee P.](https://www.linkedin.com/in/boonyawee-prasertsiripond/)       