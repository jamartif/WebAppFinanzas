# Plan Detallado: App de Finanzas Personales

## 1. Stack Tecnológico Recomendado

| Componente | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | UI interactiva, gráficos de evolución, rápido desarrollo |
| **Backend** | Node.js + Express | API REST sencilla, mismo lenguaje que el frontend, muy práctico |
| **Base de datos** | PostgreSQL 16 | Robusta para datos financieros, excelente soporte de fechas y agregaciones |
| **ORM** | Prisma | Migraciones automáticas, tipado, queries sencillas |
| **Gráficos** | Recharts | Librería de gráficos para React, ideal para evolución de patrimonio |
| **Contenedores** | Docker + docker-compose | Todo el stack orquestado en un solo comando |

> **¿Por qué no Python?** No es que Python sea malo, pero para una app web full-stack con UI rica, el ecosistema JS/TS es más fluido. Con Express + React compartes lenguaje y el desarrollo es más ágil.

---

## 2. Modelo de Datos (PostgreSQL)

### Tablas principales

```
┌─────────────────────┐     ┌──────────────────────────┐
│      banks           │     │    investment_categories  │
│─────────────────────│     │──────────────────────────│
│ id (PK)             │     │ id (PK)                  │
│ name                │     │ name                     │
│ description         │     │ type (enum)              │
│ created_at          │     │ description              │
└─────────────────────┘     └──────────────────────────┘

┌────────────────────────────────┐
│       monthly_snapshots        │  ← Registro mensual (core de la app)
│────────────────────────────────│
│ id (PK)                       │
│ month (DATE, ej: 2025-01-01)  │
│ created_at                    │
│ notes                         │
└────────────────────────────────┘

┌────────────────────────────────────┐
│       bank_balances                │  ← Liquidez por banco y mes
│────────────────────────────────────│
│ id (PK)                           │
│ snapshot_id (FK → snapshots)      │
│ bank_id (FK → banks)              │
│ balance (DECIMAL)                 │
└────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       investment_balances               │  ← Valor de cada inversión por mes
│─────────────────────────────────────────│
│ id (PK)                                │
│ snapshot_id (FK → snapshots)            │
│ category_id (FK → investment_categories)│
│ invested_amount (DECIMAL)               │  ← Lo que has metido
│ current_value (DECIMAL)                 │  ← Lo que vale ahora
└─────────────────────────────────────────┘

┌──────────────────────────────────────┐
│       passive_income                 │  ← Dividendos e ingresos pasivos
│──────────────────────────────────────│
│ id (PK)                             │
│ snapshot_id (FK → snapshots)         │
│ category_id (FK → investment_categories) │
│ amount (DECIMAL)                     │
│ source (VARCHAR)                     │  ← Nombre de la acción/fondo
│ description (TEXT)                   │
└──────────────────────────────────────┘
```

### Categorías de inversión predefinidas

| Nombre | Tipo |
|---|---|
| Fondos Indexados | FUND |
| Fondos Indexados 2 | FUND |
| Acciones | STOCK |
| Metales | COMMODITY |
| Crowdfunding Inmobiliario | CROWDFUNDING |
| Crowdlending | CROWDFUNDING |

---

## 3. Funcionalidades de la App

### 3.1 Dashboard Principal
- **Patrimonio total** actual (liquidez + inversiones)
- **Gráfico de evolución** del patrimonio mes a mes
- **Distribución** por tipo de activo (pie chart)
- **Resumen del último mes** vs mes anterior (% crecimiento)

### 3.2 Liquidez (Bancos)
- Ver saldo de cada banco en el mes actual
- Histórico de saldos por banco
- Gráfico de evolución de liquidez total

### 3.3 Inversiones
- Por cada categoría: cantidad invertida vs valor actual
- **Rentabilidad**: (valor_actual - invertido) / invertido × 100
- Gráfico de evolución por categoría
- Gráfico de rentabilidad acumulada

### 3.4 Ingresos Pasivos (Dividendos)
- Registro de cada ingreso pasivo recibido
- Total de ingresos pasivos por mes
- Gráfico de evolución de ingresos pasivos
- Desglose por fuente (qué acciones pagan más)

### 3.5 Registro Mensual
- Formulario para introducir datos a final de mes
- Saldo de cada banco
- Valor actual y cantidad invertida de cada categoría
- Dividendos recibidos durante el mes
- Posibilidad de editar meses anteriores

---

## 4. Estructura del Proyecto

```
finance-app/
├── docker-compose.yml
├── .env
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma        ← Modelo de datos
│   │   └── seed.js              ← Datos iniciales (bancos, categorías)
│   └── src/
│       ├── index.js             ← Servidor Express
│       ├── routes/
│       │   ├── snapshots.js     ← CRUD snapshots mensuales
│       │   ├── banks.js         ← CRUD bancos y saldos
│       │   ├── investments.js   ← CRUD inversiones
│       │   ├── income.js        ← CRUD ingresos pasivos
│       │   └── dashboard.js     ← Datos agregados para dashboard
│       └── middleware/
│           └── errorHandler.js
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Dashboard.jsx
│       │   ├── MonthlyForm.jsx
│       │   ├── BankBalances.jsx
│       │   ├── Investments.jsx
│       │   ├── PassiveIncome.jsx
│       │   └── charts/
│       │       ├── PatrimonyChart.jsx
│       │       ├── DistributionPie.jsx
│       │       └── GrowthChart.jsx
│       ├── hooks/
│       │   └── useApi.js
│       ├── services/
│       │   └── api.js
│       └── styles/
│           └── index.css
│
└── nginx/
    ├── Dockerfile
    └── nginx.conf               ← Reverse proxy
```

---

## 5. Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: finances
      POSTGRES_USER: finance_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://finance_user:${DB_PASSWORD}@db:5432/finances
      PORT: 3001
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "5173:5173"

  nginx:
    build: ./nginx
    depends_on:
      - backend
      - frontend
    ports:
      - "80:80"

volumes:
  pgdata:
```

---

## 6. API Endpoints

### Snapshots (Registros Mensuales)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/snapshots` | Listar todos los meses |
| GET | `/api/snapshots/:id` | Detalle de un mes (con todos los datos) |
| POST | `/api/snapshots` | Crear registro mensual completo |
| PUT | `/api/snapshots/:id` | Editar un mes |
| DELETE | `/api/snapshots/:id` | Eliminar un mes |

### Bancos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/banks` | Listar bancos |
| POST | `/api/banks` | Crear banco |
| PUT | `/api/banks/:id` | Editar banco |
| DELETE | `/api/banks/:id` | Eliminar banco |

### Categorías de Inversión
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Editar categoría |

### Dashboard
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard/summary` | Resumen patrimonio actual |
| GET | `/api/dashboard/evolution` | Evolución mensual (para gráficos) |
| GET | `/api/dashboard/income` | Resumen ingresos pasivos |

---

## 7. Fases de Desarrollo

### Fase 1 — Infraestructura (Instrucciones 1-3)
1. Crear estructura de carpetas y docker-compose
2. Configurar PostgreSQL + Prisma (schema + migraciones)
3. Seed de datos iniciales (bancos y categorías)

### Fase 2 — Backend API (Instrucciones 4-7)
4. Servidor Express + rutas base
5. CRUD de Snapshots (con bank_balances e investment_balances)
6. CRUD de Ingresos Pasivos
7. Endpoints de Dashboard (agregaciones)

### Fase 3 — Frontend Base (Instrucciones 8-11)
8. Proyecto React + Vite + Tailwind + React Router
9. Layout (sidebar + contenido principal)
10. Formulario de registro mensual
11. Vistas de listado (bancos, inversiones, ingresos)

### Fase 4 — Dashboard y Gráficos (Instrucciones 12-14)
12. Dashboard con resumen y KPIs
13. Gráficos de evolución de patrimonio
14. Gráficos de distribución e ingresos pasivos

### Fase 5 — Docker y Deploy (Instrucciones 15-16)
15. Dockerfiles para backend y frontend
16. Nginx como reverse proxy + docker-compose final

---

## 8. Cómo Empezar

Cuando estés listo, ve dándome las instrucciones fase por fase. Por ejemplo:

> "Fase 1: Crea la estructura de carpetas y el docker-compose"

Y yo generaré todo el código necesario paso a paso.

---

## 9. Métricas Clave que Podrás Ver

| Métrica | Cálculo |
|---|---|
| **Patrimonio Total** | Σ saldos bancos + Σ valor actual inversiones |
| **Liquidez Total** | Σ saldos de todos los bancos |
| **Inversión Total** | Σ cantidades invertidas |
| **Valor Inversiones** | Σ valores actuales de inversiones |
| **Rentabilidad Global** | (valor_inversiones - inversión_total) / inversión_total × 100 |
| **Rentabilidad por Categoría** | (valor_actual - invertido) / invertido × 100 |
| **Crecimiento Mensual** | patrimonio_mes_actual - patrimonio_mes_anterior |
| **Ingresos Pasivos Mes** | Σ dividendos del mes |
| **Ingresos Pasivos Acumulados** | Σ todos los dividendos históricos |
| **Yield Dividendos** | ingresos_pasivos_año / inversión_acciones × 100 |
