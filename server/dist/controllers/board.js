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
exports.createBoard = exports.getBoardName = exports.getBoards = void 0;
const board_1 = require("../models/board");
const errorHandler_1 = require("../utils/errorHandler");
function getBoards(_req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boards = yield (0, board_1.getAllBoardsFromDB)();
            res.json({ boards });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getBoards = getBoards;
function getBoardName(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = req.query.id;
            if (!id) {
                next(new errorHandler_1.ValidationError('board id is needed'));
            }
            const boardInfo = yield (0, board_1.getBoardNameFromDB)(id);
            if (boardInfo) {
                res.json({ name: boardInfo.name });
            }
            else {
                next(new Error('no such board'));
            }
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getBoardName = getBoardName;
function createBoard() {
    return __awaiter(this, void 0, void 0, function* () {
        return 0;
    });
}
exports.createBoard = createBoard;
