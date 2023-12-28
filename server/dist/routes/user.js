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
const userControl = __importStar(require("../controllers/user"));
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const uploadImage_1 = __importDefault(require("../middleware/uploadImage"));
const uploadToS3_1 = __importDefault(require("../middleware/uploadToS3"));
const router = (0, express_1.Router)();
router.route('/user/signup').post(uploadImage_1.default, uploadToS3_1.default, userControl.signUp);
router.route('/user/signin').post(userControl.signIn);
router.route('/user/read').post(verifyJWT_1.default, userControl.updateUserRead);
router.route('/user/info').get(userControl.getUserInfo);
router
    .route('/user/image')
    .post(uploadImage_1.default, uploadToS3_1.default, verifyJWT_1.default, userControl.changeImage);
router.route('/user/relation').get(verifyJWT_1.default, userControl.getUserRelation);
router.route('/user/request').post(verifyJWT_1.default, userControl.sendRequest);
router.route('/user/request/refuse').post(verifyJWT_1.default, userControl.refuseRequest);
router.route('/user/request/cancel').post(verifyJWT_1.default, userControl.cancelRequest);
router.route('/user/notification').get(verifyJWT_1.default, userControl.getNotifications);
router
    .route('/user/notification')
    .post(verifyJWT_1.default, userControl.readAllNotifications);
router.route('/user/friends').get(verifyJWT_1.default, userControl.getFriendsList);
router.route('/user/friends/all').get(verifyJWT_1.default, userControl.getAllFriendsList);
router.route('/user/preference').get(verifyJWT_1.default, userControl.getUserPreference);
exports.default = router;
