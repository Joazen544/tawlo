"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPIRE_TIME = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_KEY = process.env.JWT_KEY || '';
exports.EXPIRE_TIME = 600 * 60;
function signJWT(userId) {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({ userId }, JWT_KEY, { expiresIn: exports.EXPIRE_TIME }, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);
        });
    });
}
exports.default = signJWT;
