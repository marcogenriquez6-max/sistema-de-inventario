-- ============================================================================
-- Sistema de Repuestos - Datos Iniciales (Seed)
-- Version: 1.0.0
-- Nota: en el backend se ejecutará via TypeORM Seeder. Este archivo es de
-- referencia y para entornos sin backend (solo BD).
-- ============================================================================

-- Usuario administrador inicial. Password: Admin@123 (hash argon2id de ejemplo)
-- El backend regenera/valida este hash; use el seeder de la aplicacion.
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES
  ('admin@sistema.com', '$argon2id$v=19$m=65536,p=4,t=3$C0HOCMm+KbN+yjjYXA9QFQ$xmfLzRC5dcU7pykCmpba8sqKma6MLeGUKjLQHsOQLiE', 'Administrador', 'ADMIN', TRUE),
  ('ventas@sistema.com', '$argon2id$v=19$m=65536,p=4,t=3$C0HOCMm+KbN+yjjYXA9QFQ$xmfLzRC5dcU7pykCmpba8sqKma6MLeGUKjLQHsOQLiE', 'Vendedor Demo', 'SELLER', TRUE),
  ('gerente@sistema.com', '$argon2id$v=19$m=65536,p=4,t=3$C0HOCMm+KbN+yjjYXA9QFQ$xmfLzRC5dcU7pykCmpba8sqKma6MLeGUKjLQHsOQLiE', 'Gerente Demo', 'MANAGER', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Parametros globales (IVA 16% segun ejemplo del PDF: 15.00 -> 17.40)
INSERT INTO settings (key, value)
VALUES
  ('tax_rate',        '{"value": 16.00}'),
  ('company_name',    '{"value": "Distribuidora de Repuestos S.R.L."}'),
  ('default_margin_pct', '{"value": 50}'),
  ('doc_sequence',    '{"value": {"nota": 1, "factura": 1}}')
ON CONFLICT (key) DO NOTHING;

-- Repuestos de demostracion (ejemplo del PDF)
INSERT INTO products (sku, oem_code, barcode, name, category, brand, unit,
                      stock, min_stock, cost_price, base_price, sale_price,
                      warehouse_aisle, warehouse_shelf, warehouse_level, warehouse_bin)
VALUES
  ('FA-001', '15400-PLM-A02', '7501234560017', 'Filtro de Aceite PH-6607',  'Filtros', 'Honda',    'uds', 20, 5,  10.00, 15.00, 17.40, 'A', '1', '2', '1'),
  ('PF-002', '04465-YZZE1',   '7501234560024', 'Pastillas de Freno Del.',   'Frenos',  'Toyota',   'uds', 12, 3,  28.00, 42.00, 48.72, 'B', '2', '1', '3'),
  ('BU-003', 'DEN-IK20',      '7501234560031', 'Bujia Iridium Power',       'Encendido','NGK',     'uds', 50, 10,  4.50,  7.50,  8.70,  'C', '1', '3', '2')
ON CONFLICT (sku) DO NOTHING;

-- Compatibilidad de aplicacion
INSERT INTO product_compat (product_id, vehicle_brand, vehicle_model, year_from, year_to, engine_type)
SELECT p.id, 'Honda', 'Civic', 2016, 2021, '1.8L' FROM products p WHERE p.sku = 'FA-001'
UNION ALL
SELECT p.id, 'Honda', 'CR-V', 2017, 2022, '1.5T' FROM products p WHERE p.sku = 'FA-001'
UNION ALL
SELECT p.id, 'Toyota', 'Corolla', 2014, 2019, '1.8L' FROM products p WHERE p.sku = 'PF-002'
UNION ALL
SELECT p.id, 'Toyota', 'Rav4', 2016, 2020, '2.5L' FROM products p WHERE p.sku = 'PF-002'
UNION ALL
SELECT p.id, 'Toyota', 'Camry', 2018, 2023, '2.5L' FROM products p WHERE p.sku = 'BU-003';

-- Códigos alternativos
INSERT INTO product_codes (product_id, code_type, code_value)
SELECT p.id, 'OEM', pc.v FROM products p, unnest(ARRAY['15400-PLM-A02','04465-YZZE1','DEN-IK20']) pc(v) WHERE p.oem_code = pc.v
ON CONFLICT (code_type, code_value) DO NOTHING;

-- ============================================================================
-- Datos demo módulos ERP (v1.1.0)
-- ============================================================================

-- Plan de cuentas
INSERT INTO chart_of_accounts (code, name, type)
VALUES
  ('1000', 'Caja', 'ASSET'),
  ('1100', 'Bancos', 'ASSET'),
  ('1200', 'Inventario de Repuestos', 'ASSET'),
  ('1300', 'Cuentas por Cobrar', 'ASSET'),
  ('2000', 'Cuentas por Pagar', 'LIABILITY'),
  ('2100', 'Impuestos por Pagar', 'LIABILITY'),
  ('3000', 'Capital', 'EQUITY'),
  ('4000', 'Ingresos por Ventas', 'REVENUE'),
  ('4100', 'Descuentos', 'REVENUE'),
  ('5000', 'Costo de Ventas', 'EXPENSE'),
  ('5100', 'Gastos Operativos', 'EXPENSE')
ON CONFLICT (code) DO NOTHING;

-- Cliente demo
INSERT INTO customers (code, name, document_type, document_number, email, phone, address)
VALUES ('C-0001', 'Taller Mecánico López', 'NIT', '1234567890', 'contacto@tallerlopez.com', '77123456', 'Av. Blanco Galindo KM 7, Cochabamba')
ON CONFLICT (code) DO NOTHING;

-- Proveedor demo
INSERT INTO suppliers (code, name, tax_id, email, phone)
VALUES ('P-0001', 'Distribuidora Autopartes Central', '1098765432', 'ventas@autopartescentral.com', '42654321')
ON CONFLICT (code) DO NOTHING;

-- Cuenta bancaria demo
INSERT INTO bank_accounts (name, bank, account_type, account_number, currency, balance)
VALUES ('Caja de Ahorros - Banco Nacional', 'Banco Nacional de Bolivia', 'SAVINGS', '0000-1234-5678', 'BOB', 25000.00);

-- Empleado demo
INSERT INTO employees (code, full_name, document_number, position, department, hire_date, salary)
VALUES ('E-0001', 'María Fernanda Rojas', '987654321', 'Vendedor', 'Ventas', '2023-01-15', 2500.00)
ON CONFLICT (code) DO NOTHING;
