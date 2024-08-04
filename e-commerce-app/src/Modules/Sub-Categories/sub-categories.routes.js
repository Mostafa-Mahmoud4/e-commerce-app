import { Router } from "express";
import * as controller from "./sub-categories.controller.js";
import * as Middlewares from "../../Middlewares/index.js";
import { SubCategory } from "../../../DB/Models/index.js";
import { extensions } from "../../Utils/index.js";

// Initialize the router
const subCategoryRouter = Router();

// Destructure middlewares for ease of use
const { errorHandler, getDocumentByName, multerHost } = Middlewares;

// Define routes
/**
 * @route POST /sub-categories/create
 * @description Create a new sub-category
 * @middleware multerHost for handling file uploads
 * @middleware getDocumentByName for checking document uniqueness
 * @middleware errorHandler for handling errors
 */
subCategoryRouter.post(
  "/create",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  getDocumentByName(SubCategory),
  errorHandler(controller.createSubCategory)
);

/**
 * @route GET /sub-categories
 * @description Retrieve sub-categories based on query parameters
 * @middleware errorHandler for handling errors
 */
subCategoryRouter.get("/", errorHandler(controller.getSubCategory));

/**
 * @route PUT /sub-categories/update/:_id
 * @description Update an existing sub-category
 * @middleware multerHost for handling file uploads
 * @middleware getDocumentByName for checking document uniqueness
 * @middleware errorHandler for handling errors
 */
subCategoryRouter.put(
  "/update/:_id",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  getDocumentByName(SubCategory),
  errorHandler(controller.updateSubCategory)
);

/**
 * @route DELETE /sub-categories/delete/:_id
 * @description Delete an existing sub-category
 * @middleware errorHandler for handling errors
 */
subCategoryRouter.delete(
  "/delete/:_id",
  errorHandler(controller.deleteSubCategory)
);

// Export the router
export { subCategoryRouter };
