"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_1 = require("../controllers/message");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const router = (0, express_1.Router)();
router.route('/messageGroup').get(verifyJWT_1.default, message_1.clickChatRoom);
router.route('/messageGroups').get(verifyJWT_1.default, message_1.getNativeMessageGroups);
router.route('/messages').get(verifyJWT_1.default, message_1.getMoreMessages);
router.route('/message').post(verifyJWT_1.default, message_1.sendMessage);
router.route('/messageGroup/read').post(verifyJWT_1.default, message_1.readMessages);
exports.default = router;
