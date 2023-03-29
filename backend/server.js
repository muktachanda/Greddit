var express = require("express");
const session = require('express-session');
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const MongoDBStore = require('connect-mongodb-session')(session);
var bodyParser = require("body-parser");
const route = require("./routes/user-route");
const multer = require('multer');
const app = express()
const cors = require('cors');
const dbConnect = require("./db/dbConnect")
const jwt = require('jsonwebtoken')
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// db connection
dbConnect()

// listen
var port = 3001;
app.listen(port, function () {
    console.log("Listening on port " + port);
})

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.static('public'))
app.use(express.json())
app.set('trust-proxy', 1)


// create a user session
const store = new MongoDBStore({
    uri: process.env.DB_URL,
    databaseName: 'test',
    collection: 'sessions'
});
store.on('error', (e) => {
    console.log(e);
});
app.use(session({
    secret: 'mysecret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    },
    store: store,
    resave: false,
    saveUninitialized: true
}));

// routes
app.use('/api', route)

