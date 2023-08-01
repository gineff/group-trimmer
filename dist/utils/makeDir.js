"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
exports.default = async (path) => {
    if (!(0, node_fs_1.existsSync)(path)) {
        await (0, promises_1.mkdir)(path);
    }
};
//# sourceMappingURL=makeDir.js.map