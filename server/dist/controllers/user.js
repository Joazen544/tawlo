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
exports.cancelRequest = exports.sendRequest = exports.getUserRelation = exports.getUserName = exports.updateUserRead = exports.signIn = exports.signUp = void 0;
const mongodb_1 = require("mongodb");
const user_1 = __importStar(require("../models/user"));
const JWT_1 = require("../utils/JWT");
function signUp(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, password, passwordConfirm } = req.body;
            const userData = yield user_1.default.create({
                name,
                email,
                password,
                password_confirm: passwordConfirm,
            });
            const token = yield (0, JWT_1.signJWT)(JSON.stringify(userData._id));
            res
                .cookie('jwtToken', token)
                .status(200)
                .json({
                access_token: token,
                access_expired: JWT_1.EXPIRE_TIME,
                user: {
                    id: userData._id,
                    name,
                    email,
                    picture: '',
                },
            });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error && err.message.slice(0, 6) === 'E11000') {
                res.status(400).json({ errors: 'This email already exist' });
                return;
            }
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign up failed' });
        }
    });
}
exports.signUp = signUp;
function signIn(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            const userData = yield user_1.default.findOne({ email }).select('+password');
            if (!userData ||
                !(yield userData.correctPassword(password, userData.password))) {
                res.status(401).json({ error: 'Incorrect email or password' });
                return;
            }
            const token = yield (0, JWT_1.signJWT)(userData._id.toString());
            res
                .cookie('jwtToken', token)
                .status(200)
                .json({
                access_token: token,
                access_expired: JWT_1.EXPIRE_TIME,
                user: {
                    id: userData._id,
                    name: userData.name,
                    email,
                    picture: '',
                },
            });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign in failed' });
        }
    });
}
exports.signIn = signIn;
function updateUserRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, posts } = req.body;
            const postsId = posts.map((post) => new mongodb_1.ObjectId(post));
            const userId = new mongodb_1.ObjectId(user);
            (0, user_1.updateUserReadPosts)(userId, postsId);
            res.json({ message: 'Update success' });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign in failed' });
        }
    });
}
exports.updateUserRead = updateUserRead;
function getUserName(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user;
            if (req.query.id && typeof req.query.id === 'string')
                user = req.query.id;
            // console.log(user);
            const userInfo = yield user_1.default.findOne({ _id: user }, { name: 1 });
            if (userInfo && userInfo.name) {
                res.json({ name: userInfo.name });
            }
            else {
                throw Error('can not find user name');
            }
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getUserName = getUserName;
function getUserRelation(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const relation = yield (0, user_1.getUserRelationFromDB)(user, id);
            res.json({ relation });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getUserRelation = getUserRelation;
function sendRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const result = yield (0, user_1.createRelation)(user, id);
            if (result) {
                res.json({ status: 'send or accept request success' });
                return;
            }
            res.status(500).json({ error: 'create friend relation fail' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.sendRequest = sendRequest;
function cancelRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const result = yield (0, user_1.cancelRequestFromDB)(user, id);
            if (result) {
                res.json({ status: 'cancel request success' });
                return;
            }
            res.status(500).json({ error: 'cancel request fail' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.cancelRequest = cancelRequest;
