import slugify from "slugify";
import { nanoid } from "nanoid";
import { ErrorClass, cloudinaryConfig, uploadFile } from "../../Utils/index.js";
import { Category, SubCategory, Brand } from "../../../DB/Models/index.js";

/**
 * @api {POST} /sub-categories/create
 * @description Create a new sub-category
 */
export const createSubCategory = async (req, res, next) => {
  // Find the category by ID from the request query
  const category = await Category.findById(req.query.categoryId);
  if (!category) {
    return next(new ErrorClass("Category not found", 404, "Category not found"));
  }

  // Generate a slug for the sub-category using the name from the request body
  const { name } = req.body;
  const slug = slugify(name, { replacement: "_", lower: true });

  // Check if an image file is provided in the request
  if (!req.file) {
    return next(new ErrorClass("Please upload an image", 400, "Please upload an image"));
  }

  // Upload the image to Cloudinary and generate a unique ID for the sub-category
  const customId = nanoid(4);
  const { secure_url, public_id } = await uploadFile({
    file: req.file.path,
    folder: `${process.env.UPLOADS_FOLDER}/Categories/${category.customId}/SubCategories/${customId}`,
  });

  // Create the sub-category object
  const subCategory = {
    name,
    slug,
    Images: { secure_url, public_id },
    customId,
    categoryId: category._id,
  };

  // Save the sub-category in the database
  const newSubCategory = await SubCategory.create(subCategory);

  // Send the response with the newly created sub-category
  res.status(201).json({
    status: "success",
    message: "Sub-Category created successfully",
    data: newSubCategory,
  });
};

/**
 * @api {GET} /sub-categories
 * @description Get a sub-category by name, id, or slug
 */
export const getSubCategory = async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // Build the query filter based on provided query parameters
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // Find the sub-category based on the query filter
  const subCategory = await SubCategory.findOne(queryFilter);

  if (!subCategory) {
    return next(new ErrorClass("Category not found", 404, "Category not found"));
  }

  // Send the response with the found sub-category
  res.status(200).json({
    status: "success",
    message: "Category found",
    data: subCategory,
  });
};

/**
 * @api {PUT} /sub-categories/update/:_id
 * @description Update a sub-category
 */
export const updateSubCategory = async (req, res, next) => {
  // Extract the sub-category ID from the request parameters
  const { _id } = req.params;

  // Find the sub-category by ID and populate its associated category
  const subCategory = await SubCategory.findById(_id).populate("categoryId");
  if (!subCategory) {
    return next(new ErrorClass("subCategory not found", 404, "subCategory not found"));
  }

  // Update the name and slug if a new name is provided
  const { name } = req.body;
  if (name) {
    const slug = slugify(name, { replacement: "_", lower: true });
    subCategory.name = name;
    subCategory.slug = slug;
  }

  // Update the image if a new file is provided
  if (req.file) {
    const splitedPublicId = subCategory.Images.public_id.split(`${subCategory.customId}/`)[1];
    const { secure_url } = await uploadFile({
      file: req.file.path,
      folder: `${process.env.UPLOADS_FOLDER}/Categories/${subCategory.categoryId.customId}/SubCategories/${subCategory.customId}`,
      publicId: splitedPublicId,
    });
    subCategory.Images.secure_url = secure_url;
  }

  // Save the updated sub-category to the database
  await subCategory.save();

  // Send the response with the updated sub-category
  res.status(200).json({
    status: "success",
    message: "SubCategory updated successfully",
    data: subCategory,
  });
};

/**
 * @api {DELETE} /sub-categories/delete/:_id
 * @description Delete a sub-category
 */
export const deleteSubCategory = async (req, res, next) => {
  // Extract the sub-category ID from the request parameters
  const { _id } = req.params;

  // Find and delete the sub-category by ID, and populate its associated category
  const subCategory = await SubCategory.findByIdAndDelete(_id).populate("categoryId");
  if (!subCategory) {
    return next(new ErrorClass("subCategory not found", 404, "subCategory not found"));
  }

  // Delete the associated images from Cloudinary
  const subcategoryPath = `${process.env.UPLOADS_FOLDER}/Categories/${subCategory.categoryId.customId}/SubCategories/${subCategory.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(subcategoryPath);
  await cloudinaryConfig().api.delete_folder(subcategoryPath);

  // Delete associated brands from the database
  await Brand.deleteMany({ subCategoryId: subCategory._id });
  // TODO: Implement deletion of related products from the database

  // Send the response confirming the deletion
  res.status(200).json({
    status: "success",
    message: "SubCategory deleted successfully",
  });
};
