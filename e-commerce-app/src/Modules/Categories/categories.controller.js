import slugify from "slugify";
import { nanoid } from "nanoid";
import { ErrorClass } from "../../Utils/error-class.utils.js";
import { cloudinaryConfig, uploadFile } from "../../Utils/index.js";
import { Brand, Category, SubCategory } from "../../../DB/Models/index.js";

/**
 * @api {POST} /categories/create
 * @description Create a new category with a name and an image.
 */
export const createCategory = async (req, res, next) => {
  const { name } = req.body;

  // Generate a URL-friendly slug for the category
  const slug = slugify(name, {
    replacement: "_",
    lower: true,
  });

  // Check if an image file is provided
  if (!req.file) {
    return next(new ErrorClass("Please upload an image", 400, "Please upload an image"));
  }

  // Upload the image to Cloudinary and generate a unique identifier
  const customId = nanoid(4);
  const { secure_url, public_id } = await uploadFile({
    file: req.file.path,
    folder: `${process.env.UPLOADS_FOLDER}/Categories/${customId}`,
  });

  // Create the category object
  const category = {
    name,
    slug,
    Images: {
      secure_url,
      public_id,
    },
    customId,
  };

  // Save the new category to the database
  const newCategory = await Category.create(category);

  // Send the success response
  res.status(201).json({
    status: "success",
    message: "Category created successfully",
    data: newCategory,
  });
};

/**
 * @api {GET} /categories
 * @description Retrieve a category by name, id, or slug.
 */
export const getCategory = async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // Build query filter based on provided parameters
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // Find the category based on the filter
  const category = await Category.findOne(queryFilter);

  // Handle category not found
  if (!category) {
    return next(new ErrorClass("Category not found", 404, "Category not found"));
  }

  // Send the found category as a response
  res.status(200).json({
    status: "success",
    message: "Category found",
    data: category,
  });
};

/**
 * @api {PUT} /categories/update/:_id
 * @description Update a category's details and optionally its image.
 */
export const updateCategory = async (req, res, next) => {
  const { _id } = req.params;

  // Find the category by ID
  const category = await Category.findById(_id);
  if (!category) {
    return next(new ErrorClass("Category not found", 404, "Category not found"));
  }

  const { name, public_id_new } = req.body;

  // Update name and slug if provided
  if (name) {
    const slug = slugify(name, {
      replacement: "_",
      lower: true,
    });
    category.name = name;
    category.slug = slug;
  }

  // Update image if a new file is provided
  if (req.file) {
    const splitedPublicId = public_id_new.split(`${category.customId}/`)[1];
    const { secure_url } = await uploadFile({
      file: req.file.path,
      folder: `${process.env.UPLOADS_FOLDER}/Categories/${category.customId}`,
      publicId: splitedPublicId,
    });
    category.Images.secure_url = secure_url;
  }

  // Save the updated category
  await category.save();

  // Send the updated category as a response
  res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    data: category,
  });
};

/**
 * @api {DELETE} /categories/delete/:_id
 * @description Delete a category and its associated subcategories and brands.
 */
export const deleteCategory = async (req, res, next) => {
  const { _id } = req.params;

  // Delete the category by ID
  const category = await Category.findByIdAndDelete(_id);
  if (!category) {
    return next(new ErrorClass("Category not found", 404, "Category not found"));
  }

  // Delete related images from Cloudinary
  const categoryPath = `${process.env.UPLOADS_FOLDER}/Categories/${category?.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(categoryPath);
  await cloudinaryConfig().api.delete_folder(categoryPath);

  // Delete related subcategories and brands
  const deletedSubCategories = await SubCategory.deleteMany({ categoryId: _id });
  if (deletedSubCategories.deletedCount) {
    await Brand.deleteMany({ categoryId: _id });
    /**
     * @todo  Delete the related products from the database
     */
  }

  // Send the success response
  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
  });
};
