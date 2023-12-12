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
exports.getRelevantTagsFromDB = exports.getAutoCompleteTags = exports.addPostTagsToDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tagSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, 'A tag must have a name'],
    },
    post_num: {
        type: Number,
        required: true,
        default: 1,
    },
    relevant: {
        type: [String],
        default: [],
    },
});
const Tag = mongoose_1.default.model('Tag', tagSchema);
function addPostTagsToDB(tags) {
    return __awaiter(this, void 0, void 0, function* () {
        const tagArray = tags.map((el) => el.toLowerCase());
        const arr = tagArray.map((tag) => {
            const releventTags = tagArray.filter((el) => el !== tag);
            return {
                updateOne: {
                    filter: { name: tag },
                    update: {
                        $inc: { post_num: 1 },
                        $push: { relevant: { $each: releventTags, $slice: -20 } },
                    },
                    upsert: true,
                },
            };
        });
        yield Tag.bulkWrite(arr);
    });
}
exports.addPostTagsToDB = addPostTagsToDB;
function getAutoCompleteTags(search) {
    return __awaiter(this, void 0, void 0, function* () {
        const tags = yield Tag.aggregate([
            {
                $search: {
                    index: 'autoCompleteTags',
                    autocomplete: {
                        query: `${search}`,
                        path: 'name',
                        tokenOrder: 'sequential',
                    },
                },
            },
            { $sort: { post_num: -1 } },
            { $limit: 6 },
            {
                $project: {
                    name: 1,
                },
            },
        ]);
        return tags;
    });
}
exports.getAutoCompleteTags = getAutoCompleteTags;
function getRelevantTagsFromDB(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        const tagsInfo = yield Tag.findOne({ name: tag });
        if (!tagsInfo) {
            return 'error';
        }
        return tagsInfo.relevant;
    });
}
exports.getRelevantTagsFromDB = getRelevantTagsFromDB;
exports.default = Tag;
