"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error(err);
    if (err instanceof ValidationError) {
        res.status(400).json({ type: err.name, errors: err.message });
        return;
    }
    if (err instanceof Error) {
        res.status(500).json({ type: 'server problem', errors: err.message });
        return;
    }
    res.status(500).send('Oops, unknown error');
}
exports.errorHandler = errorHandler;
