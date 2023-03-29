const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const CommentSchema = new mongoose.Schema({
    text: {type: String, required: [true, 'enter comment']},
    postedIn: {type: String},
    postedBy: {type: String},
    subName: {type: String}
})


CommentSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Comments', CommentSchema)