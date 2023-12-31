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
require("../dotenv");
const mongodb_1 = require("mongodb");
const vitest_1 = require("vitest");
const user_1 = require("../models/user");
(0, vitest_1.describe)('#get user info', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('getting user info');
    const data = yield (0, user_1.getUserInfo)('657ae07855dd51035eb6682d');
    const image = data === null || data === void 0 ? void 0 : data.image;
    const name = data === null || data === void 0 ? void 0 : data.name;
    (0, vitest_1.test)('get user data', () => {
        (0, vitest_1.expect)(image).toBe('1702632976630.png');
        (0, vitest_1.expect)(name).toBe('Joazen Jiang');
        // expectTypeOf({ a: 1 }).toMatchTypeOf<{ a: string }>();
    });
}));
(0, vitest_1.describe)('#update user read boards', () => {
    const objectId1 = new mongodb_1.ObjectId();
    const objectId2 = new mongodb_1.ObjectId();
    const objectId3 = new mongodb_1.ObjectId();
    const objectId4 = new mongodb_1.ObjectId();
    const objectId5 = new mongodb_1.ObjectId();
    (0, vitest_1.test)('to be array of ObjectId', () => {
        const result = (0, user_1.updateReadBoards)([], objectId1);
        (0, vitest_1.expectTypeOf)(result).toBeArray();
        (0, vitest_1.expectTypeOf)(result).toMatchTypeOf();
    });
    (0, vitest_1.test)('can be length of 4', () => {
        const result = (0, user_1.updateReadBoards)([objectId1, objectId2, objectId3], objectId4);
        (0, vitest_1.expect)(result).length(4);
    });
    (0, vitest_1.test)('the last objectId will pull the first out', () => {
        const result = (0, user_1.updateReadBoards)([objectId1, objectId2, objectId3, objectId4], objectId5);
        (0, vitest_1.expect)(result).length(4);
        (0, vitest_1.expect)(result[3].toString()).toBe(objectId5.toString());
        (0, vitest_1.expect)(result[0].toString()).toBe(objectId2.toString());
    });
});
