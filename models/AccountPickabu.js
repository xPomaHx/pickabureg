var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var accountPickabuSchema = new Schema({
    ipport: String,
    nick:String,
    password:String,
    lock: {
        type: Boolean,
        default: false,
    },
});
module.exports = mongoose.model('AccountPickabu', accountPickabuSchema);