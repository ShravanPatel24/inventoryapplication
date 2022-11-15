const Category = require("../models/category");
const Item = require("../models/item");

const async = require("async");
const { body, validationResult } = require("express-validator");
const sanitizeUrl = require("@braintree/sanitize-url").sanitizeUrl;

// Display list of all items
exports.item_list = function (req, res, next) {
  Item.find()
    .populate("category")
    .exec((err, list_items) => {
      if (err) {
        return next(err);
      }

      res.render("item_list", { title: "Items", item_list: list_items });
    });
};

// Display details of one item.
exports.item_detail = function (req, res, next) {
  async.parallel(
    {
      item: (cb) => {
        Item.findById(req.params.id).populate("category").exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.item === null) {
        // Handle no results
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }

      res.render("item_detail", {
        title: results.item.name,
        item: results.item,
      });
    }
  );
};

// Display item create form on GET
exports.item_create_get = function (req, res, next) {
  // Get categories to choose from
  async.parallel(
    {
      categories: (cb) => {
        Category.find(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      res.render("item_form", {
        title: "Create an item",
        categories: results.categories,
      });
    }
  );
};

// Handle item creation on POST
exports.item_create_post = [
  // Validate and sanitize fields
  body("name", "A name for the item must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("desc", "A description for the item must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category").escape(),
  body("src", "An image URL for the item must be provided")
    .trim()
    .isLength({ min: 1 }),
  // body('src', 'An image URL for the item must be provided').trim().isLength({min: 1}).escape(),

  // Process the request after validation and sanitization
  (req, res, next) => {
    // Extract any validation errors from request
    const errors = validationResult(req);

    // Create a new object with sanitized data
    const item = new Item({
      // _id: req.params.id, // HARD REQUIREMENT, otherwise a new ID will be created and you'll end up in a hellhole of unintentionally attempting to create a new category in your update action
      name: req.body.name,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,
      numInStock: req.body.numInStock,
      real: !req.body.real,
      src: sanitizeUrl(req.body.src),
    });

    if (!errors.isEmpty()) {
      // This means there are errors. Therefore, render form again with sanitized values & error message(s)

      // Get info to display on form again
      async.parallel(
        {
          categories: (cb) => {
            Category.find(cb);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          res.render("item_form", {
            title: "Create an item",
            item: item,
            categories: results.categories,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // If we get here, data in form is valid
      // First, check if item with same name already exists so we avoid duplicates
      Item.findOne({ name: req.body.name }).exec((err, found_item) => {
        if (err) {
          return next(err);
        }

        if (found_item) {
          // Item with same name already exists, redirect to its details page
          res.redirect(found_item.url);
        } else {
          item.save((err) => {
            if (err) {
              return next(err);
            }

            // If we get here, no errors, creation successful, go to item detail page
            res.redirect(item.url);
          });
        }
      });
    }
  },
];

// Display item delete form on GET
exports.item_delete_get = function (req, res, next) {
  async.parallel(
    {
      item: (cb) => {
        Item.findById(req.params.id).populate("category").exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }

      res.render("item_delete", { title: "Delete item", item: results.item });
    }
  );
};

// Handle item deletion on POST
exports.item_delete_post = function (req, res, next) {
  async.parallel(
    {
      item: (cb) => {
        Item.findById(req.params.id).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      } else {
        Item.findByIdAndRemove(req.body.itemid, (err) => {
          if (err) {
            return next(err);
          }

          // Success, return to item list
          res.redirect("/items");
        });
      }
    }
  );
};

// Display item update form on GET
exports.item_update_get = function (req, res, next) {
  // Get item & category info to pre-fill form
  async.parallel(
    {
      item: (cb) => {
        Item.findById(req.params.id).exec(cb);
      },
      categories: (cb) => {
        Category.find(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.item === null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }

      res.render("item_form", {
        title: "Update item",
        item: results.item,
        categories: results.categories,
      });
    }
  );
};

// Handle updates to item on POST
exports.item_update_post = [
  // Validate and sanitize fields
  body("name", "A name for the item must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("desc", "A description for the item must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category").escape(),
  body("src", "An image URL for the item must be provided")
    .trim()
    .isLength({ min: 1 }),
  // body('src', 'An image URL for the item must be provided').trim().isLength({min: 1}).escape(),

  // Process the request after validation and sanitization
  (req, res, next) => {
    // Extract any validation errors from request
    const errors = validationResult(req);

    // Create a new object with sanitized data
    const item = new Item({
      _id: req.params.id, // HARD REQUIREMENT, otherwise a new ID will be created and you'll end up in a hellhole of unintentionally attempting to create a new category in your update action
      name: req.body.name,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,
      numInStock: req.body.numInStock,
      real: !req.body.real,
      src: sanitizeUrl(req.body.src),
    });

    if (!errors.isEmpty()) {
      // This means there are errros. Therefore, render form again with sanitized values & error message(s)

      // Get info to display on form again
      async.parallel(
        {
          item: (cb) => {
            Item.findById(req.params.id).exec(cb);
          },
          categories: (cb) => {
            Category.find(cb);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          res.render("item_form", {
            title: "Update item",
            item: results.item,
            categories: results.categories,
            errors: errors.array(),
          });
        }
      );
    } else {
      Item.findByIdAndUpdate(req.params.id, item, (err, theitem) => {
        if (err) {
          return next(err);
        }

        // If we get here, no errors, update successful, redirect to detail page
        res.redirect(theitem.url);
      });
    }
  },
];
