import { ErrorClass } from "../Utils/index.js";

/**
 * Middleware to find a document by name.
 * 
 * @param {Object} model - The Mongoose model to query.
 * @returns {Function} Express middleware function.
 */
export const getDocumentByName = (model) => {
  return async (req, res, next) => {
    const { name } = req.body;
    if (name) {
      try {
        const document = await model.findOne({ name });

        // If the document is not found, pass an error to the next middleware
        if (!document) {
          return next(
            new ErrorClass(
              `${model.modelName} Document not found`,
              404,
              `${model.modelName} Document not found`
            )
          );
        }

        // If the document is found, proceed to the next middleware
        req.document = document;
      } catch (error) {
        // Pass any database query errors to the error handling middleware
        return next(error);
      }
    }
    next();
  };
};
