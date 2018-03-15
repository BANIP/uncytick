var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userDataSchema = new Schema({
    galleryID: String,
    username: {type:String, default:null},
    password: {type:String, default:null},
    ip: String,
})

module.exports = mongoose.model("dcUserData", userDataSchema);