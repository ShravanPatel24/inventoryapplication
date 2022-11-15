#! /usr/bin/env node

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
const async = require("async");
const Category = require("./models/category");
const Item = require("./models/item");

var mongoose = require("mongoose");
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var categories = [];
var items = [];

function categoryCreate(name, desc, cb) {
  categoryDetail = { name: name, desc: desc };

  const category = new Category(categoryDetail);

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    categories.push(category);
    cb(null, category);
  });
}

function itemCreate(name, desc, category, price, numInStock, real, src, cb) {
  itemDetail = {
    name: name,
    desc: desc,
    category: category,
    price: price,
    numInStock: numInStock,
    real: real,
    src: src,
  };

  const item = new Item(itemDetail);

  item.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Item: " + item);
    items.push(item);
    cb(null, item);
  });
}

function populateDB(cb) {
  async.series([
    function (callback) {
      categoryCreate(
        "Sculpture",
        "Collection of the world's finest statues and carvings",
        callback
      );
    },
    function (callback) {
      categoryCreate(
        "Painting",
        "Collection of the world's finest paintings",
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Robust statue",
        "This ancient Roman statue is based on the ancient Greek statue crafted by Myron. It's a piece that shows the grandeur of the human body, beautiful from any angle.",
        categories[0],
        4980,
        1,
        false,
        null,
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Rock-head statue",
        "Giant stone head thought to be from the ancient Mesoamerican Olmec civilization. The larger ones can reach three meters in height. Scholars think they only crafted heads, no bodies.",
        categories[0],
        4980,
        1,
        false,
        null,
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Graceful painting",
        "A hand-painted piece by Hishikawa Moronobu, an artist known for popularizing the ukiyo-e style. This stirring painting depicts a fashionable woman glancing back over her shoulder.",
        categories[1],
        4980,
        1,
        false,
        null,
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Quaint painting",
        'This piece earned Vermeer the nickname "Master of Light" thanks to its exquisite contrast and depth. Vermeer painted this masterpiece at only 25 years of age. Many note that it is surprisingly small in real life.',
        categories[1],
        4980,
        1,
        false,
        null,
        callback
      );
    },
  ]);
}

async.series(
  [populateDB],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("items: " + items);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
