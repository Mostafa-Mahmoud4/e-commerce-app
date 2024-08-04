import multer from "multer";
import fs from "fs";
import path from "path";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import { extensions } from "../Utils/index.js";
import { ErrorClass } from "../Utils/index.js";

/**
 * Middleware for handling file uploads using multer with disk storage.
 *
 * @param {Object} options - Configuration options.
 * @param {string} options.filePath - The path where files will be stored.
 * @param {Array} options.allowedExtensions - The allowed MIME types for file uploads.
 * @returns {Object} multer instance.
 */
export const multerMiddleware = ({
  filePath = "general",
  allowedExtensions = extensions.Images,
}) => {
  // Resolve the destination path for file storage
  const destinationPath = path.resolve(`src/uploads/${filePath}`);

  // Check if the folder exists, create it if it doesn't
  if (!fs.existsSync(destinationPath)) {
    fs.mkdirSync(destinationPath, { recursive: true });
  }

  // Configure disk storage engine
  const storage = multer.diskStorage({
    // Set the destination for the uploaded files
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    // Set the filename for the uploaded files
    filename: (req, file, cb) => {
      const now = DateTime.now().toFormat("yyyy-MM-dd"); // Current date in YYYY-MM-DD format
      const uniqueString = nanoid(4); // Generate a unique string for the filename
      const uniqueFileName = `${now}_${uniqueString}_${file.originalname}`; // Construct the unique filename
      cb(null, uniqueFileName);
    },
  });

  // File filter function to validate the file type
  const fileFilter = (req, file, cb) => {
    if (allowedExtensions.includes(file.mimetype)) {
      return cb(null, true);
    }

    // If file type is invalid, pass an error to the callback
    cb(
      new ErrorClass(
        `Invalid file type, only ${allowedExtensions.join(', ')} are allowed`,
        400,
        `Invalid file type, only ${allowedExtensions.join(', ')} are allowed`
      ),
      false
    );
  };

  // Return the multer instance configured with the storage and file filter
  return multer({ storage, fileFilter });
};

/**
 * Middleware for handling file uploads using multer with default memory storage.
 *
 * @param {Object} options - Configuration options.
 * @param {Array} options.allowedExtensions - The allowed MIME types for file uploads.
 * @returns {Object} multer instance.
 */
export const multerHost = ({ allowedExtensions = extensions.Images }) => {
  // Configure memory storage engine
  const storage = multer.memoryStorage();

  // File filter function to validate the file type
  const fileFilter = (req, file, cb) => {
    if (allowedExtensions.includes(file.mimetype)) {
      return cb(null, true);
    }

    // If file type is invalid, pass an error to the callback
    cb(
      new ErrorClass(
        `Invalid file type, only ${allowedExtensions.join(', ')} are allowed`,
        400,
        `Invalid file type, only ${allowedExtensions.join(', ')} are allowed`
      ),
      false
    );
  };

  // Return the multer instance configured with the storage and file filter
  return multer({ storage, fileFilter });
};
