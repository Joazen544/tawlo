"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const uploadImage_1 = __importDefault(require("../middleware/uploadImage"));
const uploadToS3_1 = __importDefault(require("../middleware/uploadToS3"));
const router = (0, express_1.Router)();
// router.route('/user/upload').post(uploadImage, uploadToS3);
router.route('/user/signup').post(uploadImage_1.default, uploadToS3_1.default, user_1.signUp);
router.route('/user/signin').post(user_1.signIn);
router.route('/user/read').post(verifyJWT_1.default, user_1.updateUserRead);
router.route('/user/name').get(user_1.getUserName);
router.route('/user/image').get(user_1.getUserImage);
router
    .route('/user/image')
    .post(uploadImage_1.default, uploadToS3_1.default, verifyJWT_1.default, user_1.changeImage);
router.route('/user/relation').get(verifyJWT_1.default, user_1.getUserRelation);
router.route('/user/request').post(verifyJWT_1.default, user_1.sendRequest);
router.route('/user/cancelRequest').post(verifyJWT_1.default, user_1.cancelRequest);
router.route('/user/notification').get(verifyJWT_1.default, user_1.getNotifications);
router.route('/user/notification').post(verifyJWT_1.default, user_1.readAllNotifications);
router.route('/user/friends').get(verifyJWT_1.default, user_1.getFriendsList);
exports.default = router;
