"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        if (file.fieldname === 'user_image') {
            cb(null, `${__dirname}/../../public/userImage`);
        }
    },
    filename: (_req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 104857 },
}).fields([
    {
        name: 'user_image',
        maxCount: 1,
    },
]);
exports.default = upload;
