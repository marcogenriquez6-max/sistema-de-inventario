"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntry = void 0;
const typeorm_1 = require("typeorm");
let JournalEntry = class JournalEntry {
};
exports.JournalEntry = JournalEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], JournalEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_number', length: 30, unique: true }),
    __metadata("design:type", String)
], JournalEntry.prototype, "entryNumber", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], JournalEntry.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        name: 'reference_type',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by' }),
    __metadata("design:type", Number)
], JournalEntry.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], JournalEntry.prototype, "createdAt", void 0);
exports.JournalEntry = JournalEntry = __decorate([
    (0, typeorm_1.Entity)('journal_entries')
], JournalEntry);
//# sourceMappingURL=journal-entry.entity.js.map