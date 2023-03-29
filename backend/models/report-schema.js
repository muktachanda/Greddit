const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const ReportSchema = new mongoose.Schema({
    reportedBy: {type: String},
    reportedIn: {type: String},
    reported: {type: String},
    concern: {type: String},
    text: {type: String},
    ignore: {type: Boolean},
    date: {type: Date, default: Date.now}
})


ReportSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Reports', ReportSchema)