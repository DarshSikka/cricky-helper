const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  idE: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
});
const model = mongoose.model("User", schema, "helpusr");
module.exports = model;
