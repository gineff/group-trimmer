"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
exports.default = (str) => (0, node_crypto_1.createHash)('sha256').update(str).digest('hex').slice(0, 16);
//# sourceMappingURL=createHash.js.map