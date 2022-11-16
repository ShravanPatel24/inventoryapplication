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

function itemCreate(name, desc, category, price, numInStock, src, cb) {
  itemDetail = {
    name: name,
    desc: desc,
    category: category,
    price: price,
    numInStock: numInStock,
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
      categoryCreate("Smart Phones", "Expensive Smart Phone", callback);
    },
    function (callback) {
      categoryCreate(
        "Paintings",
        "Decoration, Bedroom - Framed Wall Posters",
        callback
      );
    },
    function (callback) {
      categoryCreate("Ear Buds", "Stylish Ear Buds", callback);
    },
    function (callback) {
      categoryCreate(
        "Smart Watch",
        "Expensive and Stylish Smart Watch",
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Samsung S22 Ultra",
        "Smart Phones",
        categories[0],
        108999,
        1000,
        "https://m.media-amazon.com/images/I/41qNJmFKAnL._SX300_SY300_QL70_FMwebp_.jpg",
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Painting",
        "Indianara Set of 3 Beautiful Flower vases Framed Art Painting",
        categories[0],
        300,
        500,
        "https://m.media-amazon.com/images/I/81Zuw3FZQXL._SL1500_.jpg",
        callback
      );
    },
    function (callback) {
      itemCreate(
        "boAt Airdopes 141",
        "True Wireless Earbuds with 42H Playtime, Beast™.",
        categories[1],
        1499,
        1000,
        "https://m.media-amazon.com/images/I/51HBom8xz7L._SL1500_.jpg",
        callback
      );
    },
    function (callback) {
      itemCreate(
        "Samsung Galaxy Watch4 LTE",
        "Full Touch Smartwatch.",
        categories[1],
        15989,
        500,
        "https://m.media-amazon.com/images/I/61Nhi7ovjkL._SL1500_.jpg",
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
