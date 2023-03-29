const mongoose = require("mongoose");
require('dotenv').config();
mongoose.set("strictQuery", false);

async function dbConnect() {
    let client;
    mongoose
        .connect(
            process.env.DB_URL, 
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        )
        .then(() => {
            console.log("Successfully connected to MongoDB Atlas!");
        })
        .catch((error) => {
            console.log("Unable to connect to MongoDB Atlas!");
            console.log(error);
        }, function(err, _client) {
            client = _client;
        })
}

module.exports = dbConnect;