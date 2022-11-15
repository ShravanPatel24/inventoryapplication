const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  src: { type: String, required: false },
});

// Virtual for book's URL
CategorySchema.virtual("url").get(function () {
  return "/category/" + this._id;
});

//Export model
module.exports = mongoose.model("Category", CategorySchema);
