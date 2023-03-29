# Greddit App

### Created as part of DASS (Design and Analysis of Software Systems) course as an assignment.

### *Run on Ubuntu 22.04.1 LTS*  

>## Brief Information
Greddiit is a web application that is similar to Reddit. The goal of this assignment is to become familiar with the MERN Stack and dockerize the app. 

>## Instructions to run
- `cd` into the 2021101071 folder and type:
```
$ sudo docker-compose build
$ sudo docker-compose up
``` 
- View the application at http://localhost:8080


>## File Structure
```
|-- backend  
|-- frontend  
|-- nginx  
|-- gitignore  
|-- docker-compose.yml  
|-- README.md
```

- The `BACKEND` folder uses ExpressJS for middleware and NodeJs for backend API calls.
    - Node needs to be installed.
    - An account needs to be made in MongoDB Atlas to create a new database.
    - Get the connection URL of the database from MongoDB atlas and store it in the .env file under DB_URL.
    - Store the JWT secret as well in the .env file under JWT_SECRET. This can be a random string.
    - This is run on port 3000 of the localhost.
    - Steps to create a backend folder:
    ```
    $ mkdir backend
    $ cd backend
    $ npm install axios
    $ npm install nodemon
    ...
    keep installing all the dependencies in a similar way
    ```
    - Changes to the package.json file:
        - In scripts, `node.js server.js` is changed to `nodemon server.js` so that changes immediately reflect.

- The `FRONTEND` folder uses ReactJS for frontend and is made using create-react app.
    - Node needs to be installed.
    - This is run on port 3001 of the localhost.
    - Steps to create a React App:
    ```
    npx create-react-app frontend
    cd frontend
    npm start
    ```
    - Changes to the package.json file:
        - `"proxy": http://localhost:3001` added so that the frontend listens to the backend requests on port 3001.
- The `NGINX` folder creates a server on port 8080 of the localhost after dockerization, so that the application can be viewed on http://localhost:8080.

- The `DOCKERCOMPOSE.YML` file is where all the dockerization happens. It imports both the Dockerfile files from frontend and backend. Note that both the frontend and backend folders contain a .dockerignore file with
```
node_modules
build
```

>## Backend Details
```
|-- backend
    |-- db
    |-- models
    |-- node_modules
    |-- routes
    |-- .dockerignore
    |--.env
    |--.gitignore
    |-- Dockerfile
    |-- package-lock.json
    |-- package.json
    |-- server.js
```
- The backend starts from `server.js`.
- `db` folder is used to connect to the MongoDB Atlas Database.
- `models` folder contains all the schemas of the needed information.
    - `comment-schema.js`- schema for comments under each post in a sub.
    - `post-schema.js` - schema for posts under each sub.
    - `report-schema.js` - schema for the reporting of a post.
    - `sub-schema.js` - schema for a sub.
    - `user-schema.js` - schema for the registered users of the app.
- `routes` contains all the API calls made from the frontend. Since we told the app to use `/api` in `server.js`, all the API calls in the frontend need to start with `/api/...`
- `Dockerfile` is setup to ensure that the backend is hosted at port 3001 when dockerized.  


>## Frontend Details
```
|-- frontend
    |-- build
    |-- node_modules
    |-- public
        |-- index.html
        |-- logo.png
    |-- src
        |-- App.css
        |-- App.js
        |-- Comments.js
        |-- Followers.js
        |-- Following.js
        |-- Home.js
        |-- index.css
        |-- JoiningRequests.js
        |-- Login.js
        |-- Logout.js
        |-- MySubs.js
        |-- MySubsIn.js
        |-- Posts.js
        |-- Profile.js
        |-- Protected.js
        |-- Register.js
        |-- Reported.js
        |-- SavedPosts.js
        |-- Stats.js
        |-- Subs.js
        |-- SubsTab.js
        |-- Tab.js
        |-- Users.js
    |-- .dockerignore
    |-- Dockerfile
    |-- package-lock.json
    |-- package.json
```
- The frontend starts at `index.js` which renders `App.js` inside a BrowserRouter so that navigation to different paths can happen.
- `App.js`: Defines all the frontend paths and protects all the paths after login/register page using logic in `Protected.js`. Goes to the login path on `/` path which can switch to `register.js` as well.
- `Register.js`: Register users and add them to user schema. Goes to the login page which is on the same path.
- `Login.js`: Authenticate user and generate a session and token. Goes to the `/home` path and renders `Home.js`.
- `Home.js`: Renders the Tabs component for the home page.
    - `Tabs.js`: Creates tabs with profile page, mysubs page, subs page, saved posts page, and logout page.
        - `Profile.js`: Shows logged in user information along with their followers and allows the user to edit their information and remove followers if they wish to.
            - `Followers.js`: Shows all the followers of the user with an option to remove them.
            - `Following.js`: Shows all the people the user follows with an option to unfollow.
        - `MySubs.js`: Allows the users to create subreddits and saves the subreddits into the sub schema. When clicked on the sub, new path with the subname added opens with further options. `SubTabs.js` is rendered.
            - `SubTabs.js`: Creates tabs with users page, joining requests page, stats page, and reports page.
                - `Users.js`: Shows all blocked and normal users who joined this particular sub.
                - `JoiningRequests.js`: Shows all the users who requested to join this subreddit so that the mod (user who created the sub) can either accept or deny.
                - `Stats.js`: Shows all the stats of the subreddit.
                - `Reported.js`: Shows all the reports in this particular subreddit and allows the mod to either block the user, delete the post, or ignore the report.
        - `Subs.js`: Allows users to see all the subs, joined first and then unjoined. On clicking the unjoined subs, they can just see the stats for that sub in another page. On clicking the joined subs, new path opens where users can post and comment in the subreddit.
            - `Posts.js`: Allows the user to create a new post, save it in the post schema, and interact with other posts. You can follow the user who posted a post or upvote or downvote a post. You can save the post as well. If you click on comment, `Comments.js` is rendered, and if you click on report, `Reported.js` is rendered.
                - `Comments.js`: Allows the user to create a new comment under this post and save it into the comments schema.
                - `Reported.js`: Allows the user to report this post and saves this report in the report schema.
        - `SavedPosts.js`: Allows users to see the posts they saved and gives them the option to unsave the posts also.
        - `Logout.js`: Allows the user to log out of the application and destroys the session. This renders the login page again.
