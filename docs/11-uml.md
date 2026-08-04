# Diagramas UML

Diagramas Mermaid del sistema de repuestos. Renderizables en GitHub, VS Code
(extensión Mermaid) o https://mermaid.live.

## 1. Arquitectura de despliegue

```mermaid
flowchart LR
    U[Usuario] -->|HTTPS 443| N[Nginx\nfrontend/nginx.conf]
    N -->|/  SPA Angular| W[Angular 22\n:8080]
    N -->|/api| A[NestJS API\n:3000]
    A -->|TypeORM + pg| PG[(PostgreSQL 15)]
    A -->|opcional REDIS_URL| R[(Redis 7\nBullMQ jobs)]
    PG -->|pg_dump diario| B[(volumen backups\nretención 7 días)]
    GH[GitHub Actions\nCI/CD] -->|docker compose| N
    GH -->|docker compose| A
    GH -->|docker compose| PG
```

## 2. Diagrama de módulos del backend (NestJS)

```mermaid
flowchart TD
    App[AppModule] --> Auth[AuthModule]
    App --> Users[UsersModule]
    App --> Catalog[CatalogModule]
    App --> Inventory[InventoryModule]
    App --> Sales[SalesModule]
    App --> Purchases[PurchasesModule]
    App --> Customers[CustomersModule]
    App --> Suppliers[SuppliersModule]
    App --> Cash[CashRegisterModule]
    App --> Accounting[AccountingModule]
    App --> Banking[BankingModule]
    App --> Hr[HrModule]
    App --> Documents[DocumentsModule]
    App --> Reports[ReportsModule]
    App --> Audit[AuditModule]
    App --> Settings[SettingsModule]
    App --> Public[PublicApiModule]
    App --> Search[SearchModule]
    App --> Export[ExportModule]
    App --> Notif[NotificationsModule]
    App --> Chat[ChatModule]
    App --> Tasks[TasksModule]
    App --> Jobs[JobsModule · BullMQ]
    App --> Cache[CacheModule · Redis/memoria]
```

## 3. Modelo de datos (entidades principales)

```mermaid
erDiagram
    users ||--o{ sales : "realiza"
    users ||--o{ stock_movements : "autoriza"
    users ||--o{ chat_room_members : "participa"
    users ||--o{ chat_messages : "envía"
    users ||--o{ tasks : "asigna/crea"
    users ||--o{ notifications : "recibe"

    products ||--o{ sale_items : "contiene"
    products ||--o{ stock_movements : "afecta"
    products ||--o{ product_codes : "alternativo"
    sales ||--o{ sale_items : "compone"
    sales ||--o{ sale_documents : "documenta"

    suppliers ||--o{ purchases : "provee"
    purchases ||--o{ products : "incluye"

    chat_rooms ||--o{ chat_room_members : "tiene"
    chat_rooms ||--o{ chat_messages : "contiene"

    products {
        bigint id PK
        varchar sku
        varchar name
        int stock
        int min_stock
        numeric price
        boolean is_active
    }
    sales {
        bigint id PK
        varchar number
        bigint cashier_id FK
        numeric subtotal
        numeric tax
        numeric total
        varchar status
    }
    users {
        bigint id PK
        varchar email
        varchar full_name
        varchar role
    }
    chat_messages {
        bigint id PK
        bigint room_id FK
        bigint sender_id FK
        varchar content
    }
    tasks {
        bigint id PK
        varchar title
        varchar status
        varchar priority
        date due_date
    }
```

## 4. Secuencia: flujo de venta

```mermaid
sequenceDiagram
    participant C as Cliente (frontend)
    participant A as API (NestJS)
    participant DB as PostgreSQL
    participant S as SSE/Notificaciones

    C->>A: POST /api/auth/login (email+password)
    A->>DB: verificar credenciales (argon2id)
    DB-->>A: usuario + role
    A-->>C: accessToken (JWT 15m) + refreshToken (7d)

    C->>A: POST /api/sales {items, customerId}
    A->>DB: transacción: insert sale + sale_items
    A->>DB: decrementar stock y registrar stock_movements
    A->>DB: insertar sale_document
    A->>DB: insertar notification (SALE → ADMIN/MANAGER)
    DB-->>A: OK
    A-->>S: SSE push notificación en vivo
    A-->>C: 201 {number, total}
```

## 5. Secuencia: chat interno en tiempo real

```mermaid
sequenceDiagram
    participant U1 as Usuario A
    participant API as API (NestJS)
    participant U2 as Usuario B (SSE)

    U1->>API: POST /api/chat/rooms {type, participantIds}
    API-->>U1: sala creada (RoomView)
    U2->>API: GET /api/chat/stream (EventSource, Bearer)
    API-->>U2: conexión SSE abierta
    U1->>API: POST /api/chat/rooms/1/messages {content}
    API->>API: emit via Subject a todos los miembros
    API-->>U2: SSE event (message)
    API->>API: crear notification CHAT para destinatarios
```
