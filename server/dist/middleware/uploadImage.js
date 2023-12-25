"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const store = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, `${__dirname}/../../public/userImage`);
    },
    filename: (_req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: store,
    limits: { fileSize: 5242880 },
}).single('image');
exports.default = upload;
