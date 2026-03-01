# WebApp Finanzas

Aplicación web de control de patrimonio personal. Permite registrar mensualmente los saldos bancarios, inversiones e ingresos pasivos, y visualizar la evolución a lo largo del tiempo con gráficos interactivos.

Diseñada para uso local/doméstico, sin login: varios perfiles de usuario que se seleccionan desde la barra lateral.

---

## Capturas

> Dashboard con KPIs, evolución de patrimonio y distribución de activos.

---

## Funcionalidades

- **Dashboard** — patrimonio total, liquidez, valor de inversiones, rentabilidad global, crecimiento mensual e ingresos pasivos del mes, con gráficos de evolución y distribución
- **Liquidez (Bancos)** — gestión de cuentas bancarias e histórico de saldos por banco
- **Inversiones** — seguimiento por categoría (fondos, acciones, commodities, crowdfunding), acumulado automático y rentabilidad
- **Ingresos Pasivos** — registro de dividendos e ingresos por mes y fuente, con gráficos de evolución
- **Registro Mensual** — formulario unificado para introducir todos los datos del mes (saldos, inversiones, dividendos). Si el mes ya existe, actualiza los datos en lugar de duplicar
- **Perfiles** — múltiples usuarios independientes (ej: "Javier", "Maria"), cada uno con sus propios datos, sin necesidad de contraseña

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Gráficos | Recharts |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL 16 |
| Reverse proxy | Nginx |
| Contenedores | Docker + Docker Compose |

---

## Estructura del proyecto

```
WebAppFinanzas/
├── docker-compose.yml
├── .env                          # Variables de entorno (no incluido en git)
│
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de datos
│   │   └── seed.js               # Datos iniciales
│   └── src/
│       ├── index.js              # Servidor Express
│       ├── routes/
│       │   ├── profiles.js
│       │   ├── banks.js
│       │   ├── categories.js
│       │   ├── snapshots.js
│       │   ├── income.js
│       │   └── dashboard.js
│       └── middleware/
│           ├── requireProfile.js
│           └── errorHandler.js
│
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── contexts/
│       │   └── ProfileContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Dashboard.jsx
│       │   ├── BankBalances.jsx
│       │   ├── Investments.jsx
│       │   ├── PassiveIncome.jsx
│       │   ├── MonthlyForm.jsx
│       │   ├── Profiles.jsx
│       │   └── charts/
│       ├── hooks/
│       │   └── useApi.js
│       └── services/
│           └── api.js
│
└── nginx/
    └── nginx.conf
```

---

## Modelo de datos

```
profiles ──┬── banks ──── bank_balances ──┐
           │                              ├── monthly_snapshots
           ├── investment_categories ─────┤   (un registro por perfil+mes)
           │      └── passive_income ─────┘
           └── monthly_snapshots
```

Cada perfil tiene sus propios bancos, categorías de inversión y snapshots mensuales. El borrado de un perfil elimina todos sus datos en cascada.

---

## Instalación y puesta en marcha

### Requisitos

- Docker y Docker Compose

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/WebAppFinanzas.git
cd WebAppFinanzas
```

### 2. Crear el archivo `.env`

```bash
# .env (en la raíz del proyecto)
DB_PASSWORD=tu_contraseña_segura
```

### 3. Arrancar

```bash
docker compose up -d
```

Al iniciar, el backend ejecuta automáticamente:
1. `prisma migrate deploy` — aplica las migraciones de la base de datos
2. `node prisma/seed.js` — crea el perfil y los datos iniciales si no existen

La app queda disponible en **http://localhost:8080**

---

## Despliegue en NAS u otro servidor

El proceso es idéntico. Ejemplo con Docker context remoto:

```bash
# Construir imágenes en el servidor remoto
docker --context mi-nas compose build --no-cache

# Levantar contenedores
docker --context mi-nas compose up -d
```

---

## API REST

Todos los endpoints que devuelven datos de perfil requieren `?profileId=N` en la query string.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/profiles` | Listar perfiles |
| POST | `/api/profiles` | Crear perfil |
| PUT | `/api/profiles/:id` | Renombrar perfil |
| DELETE | `/api/profiles/:id` | Eliminar perfil |
| GET | `/api/banks?profileId=N` | Listar bancos del perfil |
| POST | `/api/banks?profileId=N` | Crear banco |
| GET | `/api/categories?profileId=N` | Listar categorías de inversión |
| POST | `/api/categories?profileId=N` | Crear categoría |
| GET | `/api/snapshots?profileId=N` | Listar registros mensuales |
| POST | `/api/snapshots?profileId=N` | Crear/actualizar registro mensual |
| PUT | `/api/snapshots/:id` | Editar registro mensual |
| DELETE | `/api/snapshots/:id` | Eliminar registro mensual |
| GET | `/api/dashboard/summary?profileId=N` | Resumen de patrimonio actual |
| GET | `/api/dashboard/evolution?profileId=N` | Evolución mensual (gráficos) |
| GET | `/api/dashboard/income?profileId=N` | Resumen de ingresos pasivos |

---

## Métricas calculadas

| Métrica | Cálculo |
|---------|---------|
| Patrimonio Total | Σ saldos bancarios + Σ valor actual de inversiones |
| Rentabilidad Global | (valor inversiones − invertido acumulado) / invertido acumulado × 100 |
| Crecimiento Mensual | patrimonio mes actual − patrimonio mes anterior |
| Acumulado de inversión | Se recalcula automáticamente al insertar o editar un mes |

---

## Licencia

Uso personal. Sin licencia definida.
