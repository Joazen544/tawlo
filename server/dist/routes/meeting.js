"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meeting_1 = require("../controllers/meeting");
const message_1 = require("../controllers/message");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const router = (0, express_1.Router)();
router.route('/meeting').post(verifyJWT_1.default, meeting_1.accessMeeting);
router.route('/meeting').delete(verifyJWT_1.default, meeting_1.cancelMeeting);
router.route('/meeting').get(verifyJWT_1.default, meeting_1.getMeeting);
router
    .route('/meeting/:meetingId')
    .post(verifyJWT_1.default, meeting_1.replyMeeting, message_1.clickChatRoom);
router.route('/meeting/:meetingId/score').post(verifyJWT_1.default, meeting_1.scoreMeeting);
exports.default = router;
