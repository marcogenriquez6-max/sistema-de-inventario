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
exports.ModuleRegistryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ModuleRegistryService = class ModuleRegistryService {
    constructor(configService) {
        this.configService = configService;
        this.modules = [
            {
                name: 'Autenticación y seguridad',
                slug: 'auth',
                enabled: true,
                description: 'JWT, refresh, RBAC y protección de acceso.',
                category: 'core',
            },
            {
                name: 'Gestión de usuarios',
                slug: 'users',
                enabled: true,
                description: 'Usuarios, perfiles y administración de accesos.',
                category: 'core',
            },
            {
                name: 'Configuración del sistema',
                slug: 'settings',
                enabled: true,
                description: 'Parámetros globales, tax rates y ajustes del negocio.',
                category: 'support',
            },
            {
                name: 'Catálogo de productos',
                slug: 'catalog',
                enabled: true,
                description: 'Productos, multicódigo, ubicaciones y compatibilidades.',
                category: 'operational',
            },
            {
                name: 'Precios',
                slug: 'pricing',
                enabled: true,
                description: 'Políticas de precio, márgenes y ajustes de venta.',
                category: 'financial',
            },
            {
                name: 'Inventario',
                slug: 'inventory',
                enabled: true,
                description: 'Kardex, stock, entradas y ajustes de inventario.',
                category: 'operational',
            },
            {
                name: 'Ventas y POS',
                slug: 'sales',
                enabled: true,
                description: 'Documentos de venta, transacciones y facturación.',
                category: 'financial',
            },
            {
                name: 'Clientes',
                slug: 'customers',
                enabled: true,
                description: 'Gestión de clientes y historial comercial.',
                category: 'operational',
            },
            {
                name: 'Proveedores',
                slug: 'suppliers',
                enabled: true,
                description: 'Administración de relaciones con proveedores.',
                category: 'operational',
            },
            {
                name: 'Compras',
                slug: 'purchases',
                enabled: true,
                description: 'Ordenes, ingresos y control de compras.',
                category: 'operational',
            },
            {
                name: 'Caja',
                slug: 'cash_register',
                enabled: true,
                description: 'Apertura, movimientos y cierre de caja.',
                category: 'financial',
            },
            {
                name: 'Bancos y tesorería',
                slug: 'banking',
                enabled: true,
                description: 'Movimientos bancarios y control de tesorería.',
                category: 'financial',
            },
            {
                name: 'Contabilidad',
                slug: 'accounting',
                enabled: true,
                description: 'Plan de cuentas, asientos y balances.',
                category: 'financial',
            },
            {
                name: 'Recursos humanos',
                slug: 'hr',
                enabled: true,
                description: 'Empleados, asistencias y procesos básicos de RR.HH.',
                category: 'operational',
            },
            {
                name: 'Documentos',
                slug: 'documents',
                enabled: true,
                description: 'Gestión documental y metadatos de archivos.',
                category: 'support',
            },
            {
                name: 'Reportes',
                slug: 'reports',
                enabled: true,
                description: 'Dashboards y reportes ejecutivos.',
                category: 'support',
            },
            {
                name: 'Auditoría',
                slug: 'audit',
                enabled: true,
                description: 'Trazabilidad, registros y acciones sensibles.',
                category: 'support',
            },
            {
                name: 'API pública',
                slug: 'public_api',
                enabled: true,
                description: 'Endpoints públicos para integración y consumo externo.',
                category: 'support',
            },
            {
                name: 'Integraciones',
                slug: 'integrations',
                enabled: true,
                description: 'Webhooks, api keys y sincronización externa.',
                category: 'support',
            },
        ];
    }
    getModules() {
        const configured = this.configService.get('MODULES_ENABLED');
        const enabledSlugs = new Set((configured ?? '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean));
        return this.modules.map((module) => ({
            ...module,
            enabled: module.slug === 'auth' || module.slug === 'users' || enabledSlugs.has(module.slug),
        }));
    }
    getEnabledCount() {
        return this.getModules().filter((module) => module.enabled).length;
    }
};
exports.ModuleRegistryService = ModuleRegistryService;
exports.ModuleRegistryService = ModuleRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ModuleRegistryService);
//# sourceMappingURL=module-registry.service.js.map