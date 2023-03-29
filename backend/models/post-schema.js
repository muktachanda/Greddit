const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const PostSchema = new mongoose.Schema({
    text: {type: String, required: [true, 'enter subgreddiit text']},
    postedBy: {type: String},
    postedIn: {type: String},
    upvotes: {type: Number},
    downvotes: {type: Number},
    date: {type: Date, default: Date.now}
})


PostSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Post', PostSchema)