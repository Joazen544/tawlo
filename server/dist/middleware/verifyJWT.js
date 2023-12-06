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
Object.defineProperty(exports, "__esModule", { value: true });
const JWT_1 = require("../utils/JWT");
function default_1(req, _res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            next(new Error('No auth!!'));
        }
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) {
            next(new Error('No token!!'));
        }
        else {
            (0, JWT_1.verify)(token)
                .then((data) => {
                const userInfo = data;
                req.body.user = userInfo.userId;
                next();
            })
                .catch((err) => {
                next(err);
            });
        }
    });
}
exports.default = default_1;
