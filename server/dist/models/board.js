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
exports.getBoardName = exports.getAllBoards = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const boardSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
    },
    admin: mongodb_1.ObjectId,
});
const Board = mongoose_1.default.model('Board', boardSchema);
function getAllBoards() {
    return __awaiter(this, void 0, void 0, function* () {
        const allBoards = yield Board.find();
        return allBoards;
    });
}
exports.getAllBoards = getAllBoards;
function getBoardName(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = yield Board.findOne({ _id: id });
        return name;
    });
}
exports.getBoardName = getBoardName;
exports.default = Board;
