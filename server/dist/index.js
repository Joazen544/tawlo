"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./dotenv");
require("./utils/redis");
require("./models/mongodb");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./routes/user"));
const post_1 = __importDefault(require("./routes/post"));
const message_1 = __importDefault(require("./routes/message"));
const board_1 = __importDefault(require("./routes/board"));
const meeting_1 = __importDefault(require("./routes/meeting"));
const errorHandler_1 = require("./utils/errorHandler");
const socket_1 = require("./controllers/socket");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// connect socket
(0, socket_1.initSocket)(server);
// app.use(cors());
app.use((0, cors_1.default)({ credentials: true, origin: true }));
app.use(express_1.default.json());
app.use('/api', [
    user_1.default,
    post_1.default,
    message_1.default,
    board_1.default,
    meeting_1.default,
]);
app.use(express_1.default.static(path_1.default.join(__dirname, '../dist')));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../dist/index.html'));
});
app.use(errorHandler_1.errorHandler);
server.listen(process.env.PORT, () => {
    console.log(`port running on ${process.env.PORT}`);
});
