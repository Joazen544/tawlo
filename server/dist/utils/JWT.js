"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.signJWT = exports.EXPIRE_TIME = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_KEY = process.env.JWT_KEY || '';
exports.EXPIRE_TIME = 6000 * 6000;
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
exports.signJWT = signJWT;
function verify(token) {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, JWT_KEY, (err, data) => {
            if (err) {
                reject(new Error('The token is expired or wrong'));
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.verify = verify;
