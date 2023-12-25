"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv");
const conn = mongoose_1.default
    .connect(process.env.DATABASE || 'fail', {})
    .then(() => {
    console.log('connect to mongoDB.');
})
    .catch((err) => {
    console.log('conn failed');
    console.log(err);
});
exports.default = conn;
