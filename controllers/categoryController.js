const Category = require("../models/category");
const Item = require("../models/item");

const async = require("async");
const { body, validationResult } = require("express-validator");
const sanitizeUrl = require("@braintree/sanitize-url").sanitizeUrl;

// Display all categories
exports.category_list = function (req, res, next) {
  // Category.find({},'name desc')
  Category.find().exec((err, list_categories) => {
    if (err) {
      return next(err);
    }

    console.log(list_categories);
    res.render("category_list", {
      title: "Categories",
      category_list: list_categories,
    });
  });
};

// Display details of one category.
exports.category_detail = function (req, res, next) {
  async.parallel(
    {
      category: (cb) => {
        Category.findById(req.params.id).exec(cb);
      },
      items: (cb) => {
        Item.find({ category: req.params.id }).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.category === null) {
        // Handle no results
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }

      res.render("category_detail", {
        title: results.category.name,
        category: results.category,
        items: results.items,
      });
    }
  );
};

// Display category update form on GET
exports.category_update_get = function (req, res, next) {
  // Get category for the form
  async.parallel(
    {
      category: (cb) => {
        Category.findById(req.params.id).exec(cb);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.category === null) {
        // Handle no results
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }

      // Handle success
      res.render("category_form", {
        title: "Update category",
        category: results.category,
      });
    }
  );
};

// Handle category creation on POST
exports.category_create_post = [
  // Validate and sanitize fields
  body("name", "A name for the category must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("desc", "A description for the category must be provided")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category").escape(),
  body("src", "An image URL for the category must be provided")
    .trim()
    .isLength({ min: 1 }),
  // body('src', 'An image URL for the item must be provided').trim().isLength({min: 1}).escape(),

  // Process the request after validation and sanitization
  (req, res, next) => {
    // Extract any validation errors from request
    const errors = validationResult(req);

    // Create a new object with sanitized data
    const category = new Item({
      // _id: req.params.id, // HARD REQUIREMENT, otherwise a new ID will be created and you'll end up in a hellhole of unintentionally attempting to create a new category in your update action
      name: req.body.name,
      desc: req.body.desc,
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

          res.render("category_form", {
            title: "Create an category",
            category: category,
            categories: results.categories,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // If we get here, data in form is valid
      // First, check if item with same name already exists so we avoid duplicates
      category.findOne({ name: req.body.name }).exec((err, found_item) => {
        if (err) {
          return next(err);
        }

        if (found_item) {
          // Item with same name already exists, redirect to its details page
          res.redirect(found_item.url);
        } else {
          category.save((err) => {
            if (err) {
              return next(err);
            }

            // If we get here, no errors, creation successful, go to item detail page
            res.redirect(category.url);
          });
        }
      });
    }
  },
];

// Handle updates to category on POST
exports.category_update_post = [
  // Validate and sanitize fields.
  body("name", "Category name required").trim().isLength({ min: 1 }).escape(),
  body("desc", "Category description required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("src", "An image URL for the category must be provided")
    .trim()
    .isLength({ min: 1 }),

  // Process the request after validation and sanitization
  (req, res, next) => {
    // Extract any validation errors from request
    const errors = validationResult(req);

    // Create a new object with sanitized data
    const category = new Category({
      _id: req.params.id, // HARD REQUIREMENT, otherwise a new ID will be created and you'll end up in a hellhole of unintentionally attempting to create a new category in your update action
      name: req.body.name,
      desc: req.body.desc,
      src: sanitizeUrl(req.body.src),
    });

    if (!errors.isEmpty()) {
      // This means there are errors. Therefore, render form again with sanitized values & error message(s)

      // Get info to display on form again
      async.parallel(
        {
          category: (cb) => {
            Category.findById(req.params.id).exec(cb);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Handle success
          res.render("category_form", {
            title: "Update category",
            category: results.category,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      Category.findByIdAndUpdate(req.params.id, category, (err, genre) => {
        if (err) {
          return next(err);
        }

        // If we get here, no errors, update successful, redirect to category detail page
        res.redirect(category.url);
      });
    }
  },
];
