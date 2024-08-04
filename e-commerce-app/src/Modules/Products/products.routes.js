import { Router } from "express";
import * as controller from "./products.controller.js";
import * as Middlewares from "../../Middlewares/index.js";
import { extensions } from "../../Utils/index.js";
import { Brand } from "../../../DB/Models/index.js";

const productRouter = Router();
const { errorHandler, multerHost, checkIfIdsExist } = Middlewares;

/**
 * @api {POST} /products/add Add a new product
 * @middleware multerHost, checkIfIdsExist
 * @description Uploads images, validates brand ID, and adds a new product.
 */
productRouter.post(
  "/add",
  multerHost({ allowedExtensions: extensions.Images }).array("image", 5),
  checkIfIdsExist(Brand),
  errorHandler(controller.addProduct)
);

/**
 * @api {PUT} /products/update/:productId Update an existing product
 * @description Updates the details of an existing product.
 */
productRouter.put(
  "/update/:productId",
  errorHandler(controller.updateProduct)
);

/**
 * @api {GET} /products/list List all products
 * @description Retrieves a list of products with pagination.
 */
productRouter.get("/list", errorHandler(controller.listProducts));

export { productRouter };
