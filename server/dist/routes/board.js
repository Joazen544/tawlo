"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const board_1 = require("../controllers/board");
const router = (0, express_1.Router)();
// to get all the boards
router.route('/boards').get(board_1.getBoards);
router.route('/board/name').get(board_1.getBoardName);
exports.default = router;
