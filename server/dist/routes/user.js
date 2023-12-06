"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
// import upload from '../middleware/uploadImage';
const router = (0, express_1.Router)();
router.route('/user/signup').post(user_1.signUp);
router.route('/user/signin').post(user_1.signIn);
router.route('/user/read').post(verifyJWT_1.default, user_1.updateUserRead);
router.route('/user/name').get(user_1.getUserName);
router.route('/user/relation').get(verifyJWT_1.default, user_1.getUserRelation);
router.route('/user/request').post(verifyJWT_1.default, user_1.sendRequest);
router.route('/user/cancelRequest').post(verifyJWT_1.default, user_1.cancelRequest);
exports.default = router;
