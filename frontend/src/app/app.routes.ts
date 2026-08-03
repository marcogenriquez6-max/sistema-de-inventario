import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
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
        canActivate: [roleGuard('ADMIN', 'MANAGER', 'SELLER')],
      },
      { path: 'catalog', component: CatalogListComponent },
      { path: 'catalog/new', component: ProductFormComponent },
      { path: 'catalog/:id', component: ProductFormComponent },
      {
        path: 'inventory',
        component: InventoryComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')],
      },
      {
        path: 'sales',
        component: SalesComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER', 'SELLER')],
      },
      { path: 'customers', component: CustomersComponent },
      {
        path: 'suppliers',
        component: SuppliersComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
      },
      {
        path: 'purchases',
        component: PurchasesComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
      },
      {
        path: 'cash-register',
        component: CashRegisterComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER', 'SELLER')],
      },
      {
        path: 'accounting',
        component: AccountingComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
      },
      {
        path: 'banking',
        component: BankingComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
      },
      { path: 'hr', component: HrComponent, canActivate: [roleGuard('ADMIN', 'MANAGER')] },
      { path: 'documents', component: DocumentsComponent },
      { path: 'audit', component: AuditComponent, canActivate: [roleGuard('ADMIN', 'AUDITOR')] },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [roleGuard('ADMIN', 'MANAGER', 'AUDITOR')],
      },
      { path: 'settings', component: SettingsComponent, canActivate: [roleGuard('ADMIN')] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
