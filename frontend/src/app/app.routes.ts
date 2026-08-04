import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/guards/auth.guard';
import { ShellComponent } from './core/layout/shell.component';
import { LoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CatalogListComponent } from './pages/catalog/catalog-list.component';
import { ProductFormComponent } from './pages/catalog/product-form.component';
import { PosComponent } from './pages/pos/pos.component';
import { SalesComponent } from './pages/sales/sales.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { PurchasesComponent } from './pages/purchases/purchases.component';
import { CashRegisterComponent } from './pages/cash-register/cash-register.component';
import { AccountingComponent } from './pages/accounting/accounting.component';
import { BankingComponent } from './pages/banking/banking.component';
import { HrComponent } from './pages/hr/hr.component';
import { DocumentsComponent } from './pages/documents/documents.component';
import { AuditComponent } from './pages/audit/audit.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { KanbanComponent } from './pages/kanban/kanban.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { ModulesComponent } from './pages/modules/modules.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'pos',
        component: PosComponent,
        canActivate: [permissionGuard('pos')],
      },
      { path: 'catalog', component: CatalogListComponent },
      { path: 'catalog/new', component: ProductFormComponent },
      { path: 'catalog/:id', component: ProductFormComponent },
      {
        path: 'inventory',
        component: InventoryComponent,
        canActivate: [permissionGuard('inventory')],
      },
      {
        path: 'sales',
        component: SalesComponent,
        canActivate: [permissionGuard('sales')],
      },
      { path: 'customers', component: CustomersComponent },
      {
        path: 'suppliers',
        component: SuppliersComponent,
        canActivate: [permissionGuard('suppliers')],
      },
      {
        path: 'purchases',
        component: PurchasesComponent,
        canActivate: [permissionGuard('purchases')],
      },
      {
        path: 'cash-register',
        component: CashRegisterComponent,
        canActivate: [permissionGuard('cash_register')],
      },
      {
        path: 'accounting',
        component: AccountingComponent,
        canActivate: [permissionGuard('accounting')],
      },
      {
        path: 'banking',
        component: BankingComponent,
        canActivate: [permissionGuard('banking')],
      },
      { path: 'hr', component: HrComponent, canActivate: [permissionGuard('hr')] },
      { path: 'documents', component: DocumentsComponent },
      { path: 'kanban', component: KanbanComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'audit', component: AuditComponent, canActivate: [permissionGuard('audit')] },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [permissionGuard('reports')],
      },
      { path: 'permissions', component: PermissionsComponent, canActivate: [permissionGuard('permissions')] },
      { path: 'modules', component: ModulesComponent },
      { path: 'settings', component: SettingsComponent, canActivate: [permissionGuard('settings')] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
