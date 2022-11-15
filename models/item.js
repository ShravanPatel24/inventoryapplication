const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  price: { type: Number, required: true },
  numInStock: { type: Number, required: true },
  real: { type: Boolean, required: true },
  src: { type: String, required: false },
});

// Virtual for book's URL
ItemSchema.virtual("url").get(function () {
  return "/item/" + this._id;
});

//Export model
module.exports = mongoose.model("Item", ItemSchema);
