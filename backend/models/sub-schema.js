const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const { Schema } = mongoose;

const SubSchema = new mongoose.Schema({
    name: {type: String, required: [true, 'Enter name'], unique: true},
    description: {type: String, required: [true, 'Enter description']},
    tags: [{ type: String, lowercase: true}],
    banned: [ {type: String} ],
    postedBy: {type: String },
    people: [ {members: { type: String, default: '' }, date: { type: Date, default: Date.now } } ],
    posts: [ {post: { type: String, default: '' }, date: { type: Date, default: Date.now } } ],
    date: {type: Date, default: Date.now},
    requests: [{type: String}],
    visitors: [{ visitor: String, date: { type: Date, default: Date.now } }],
    reported: [{type: String}],
    blocked: [{type: String}],
    numReported: {type: Number, default: 0},
    numDeleted: {type: Number, default: 0}
});


SubSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Sub', SubSchema)