"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meetingControl = __importStar(require("../controllers/meeting"));
const message_1 = require("../controllers/message");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const router = (0, express_1.Router)();
router.route('/meeting').post(verifyJWT_1.default, meetingControl.accessMeeting);
router.route('/meeting').delete(verifyJWT_1.default, meetingControl.cancelMeeting);
router.route('/meeting').get(verifyJWT_1.default, meetingControl.getMeeting);
router
    .route('/meeting/:meetingId')
    .post(verifyJWT_1.default, meetingControl.replyMeeting, message_1.clickChatRoom);
router
    .route('/meeting/:meetingId/score')
    .post(verifyJWT_1.default, meetingControl.scoreMeeting);
router.route('/meeting/share').get(meetingControl.getSharings);
router.route('/meeting/ask').get(meetingControl.getAskings);
exports.default = router;
