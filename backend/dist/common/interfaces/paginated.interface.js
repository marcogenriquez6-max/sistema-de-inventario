"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaginated = toPaginated;
function toPaginated(items, totalItems, page, pageSize) {
    return {
        items,
        meta: {
            page,
            pageSize,
            totalItems,
            totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
        },
    };
}
//# sourceMappingURL=paginated.interface.js.map