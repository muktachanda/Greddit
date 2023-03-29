const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const UserSchema = new mongoose.Schema({
    first: {type: String, required: [true, 'provide first name']},
    last: {type: String, required: [true, 'provide last name']},
    username: {type: String, required: [true, 'provide username'], unique: true},
    email: {type: String, required: [true, 'provide email']},
    age: {type: String, required: [true, 'provide age']},
    contact: {type: String, required: [true, 'provide contact']},
    password: {type: String, required: [true, 'provide password']},
    followers: [{type: String}],
    following: [{type: String}],
    saved: [{type: String}],
    joinedsubs: [{type: String}],
    leftsubs: [{type: String}],
})


UserSchema.plugin(uniqueValidator)
module.exports = mongoose.model('User', UserSchema)