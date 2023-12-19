"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const s3_1 = __importDefault(require("../models/s3"));
const uploadFilesToS3 = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.file) {
            const userImageFile = req.file;
            yield (0, s3_1.default)(userImageFile, 'user-image');
        }
        next();
    }
    catch (err) {
        console.log('something is wrong uploading image');
        next(err);
    }
});
exports.default = uploadFilesToS3;
