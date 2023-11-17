"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./dotenv");
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("./routes/user"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('api', [user_1.default]);
app.get('/', (req, res) => {
    res.send(req.body);
});
app.listen(process.env.PORT, () => {
    console.log('port running on 3000');
});
