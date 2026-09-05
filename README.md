# CompetencyX Frontend

Nuxt 4 frontend ของ CompetencyX — หน้าเว็บสำหรับทำ Role Discovery, Skill Assessment, ดูผล และดู roadmap
คุยกับ backend ผ่าน HTTP ล้วน โดยอ่าน base URL จาก `NUXT_PUBLIC_API_BASE`

Backend อยู่คนละ repo: [CompetencyX-Backend](https://github.com/Pattaradanai888/CompetencyX-Backend)

---

## 1. สิ่งที่ต้องมีก่อน

| ต้องมี             | หมายเหตุ                                                    |
| ------------------ | ----------------------------------------------------------- |
| Node.js 22 ขึ้นไป  | ดู `engines` ใน `package.json`                              |
| pnpm 10            | โปรเจกต์ commit `pnpm-lock.yaml` ไว้ อย่าใช้ npm/yarn ปนกัน |
| Backend ที่รันอยู่ | ถ้าไม่มี หน้าเว็บจะขึ้นแต่โหลดคำถามไม่ได้                   |

เปิด pnpm ผ่าน corepack ได้เลย ไม่ต้องติดตั้งเอง

```powershell
corepack enable
```

---

## 2. เริ่มใช้งาน

```powershell
# 2.1 ติดตั้ง dependencies
pnpm install

# 2.2 สร้างไฟล์ .env
Copy-Item .env.example .env

# 2.3 รัน dev server ที่ http://localhost:3000
pnpm dev
```

ใน `.env` ชี้ไปที่ backend

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

ต้องสตาร์ท backend คู่กันด้วย (ดูวิธีใน README ของ repo backend) ให้อยู่ที่พอร์ต 8000

---

## 3. คำสั่งที่ใช้บ่อย

```powershell
pnpm dev            # dev server + HMR
pnpm build          # production build ออกไปที่ .output/
pnpm preview        # ลองรัน production build ในเครื่อง
pnpm generate       # static build (ใช้เฉพาะกรณีที่ไม่ต้องการ server)

pnpm lint           # ESLint
pnpm lint:fix       # ESLint แก้อัตโนมัติเท่าที่ปลอดภัย
pnpm format         # Prettier เขียนทับไฟล์
pnpm format:check   # เช็ค format เฉย ๆ ใช้ก่อนเปิด PR

pnpm typecheck      # vue-tsc ผ่าน nuxt typecheck
pnpm test           # vitest ทุก project (e2e จะ skip เองถ้าไม่ได้ตั้ง E2E_BASE_URL)
pnpm test:unit      # เฉพาะ test/unit
pnpm test:nuxt      # เฉพาะ test/nuxt (รันใน environment ของ Nuxt)
pnpm test:e2e       # เฉพาะ test/e2e — ต้องมี FE และ BE รันอยู่จริง ดูข้อ 4.1
pnpm test:watch     # โหมด watch
```

รัน `pnpm lint`, `pnpm typecheck` กับ `pnpm test` ให้ผ่านก่อนเปิด PR

### 3.1 CI (GitHub Actions)

ทุก push ไป `main` และทุก pull request รัน `.github/workflows/ci.yml` แยกเป็น 3 job ขนานกัน

| Job      | ทำอะไร                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checks` | `pnpm lint`, `format:check`, `typecheck`, `test:unit`, `test:nuxt`, `build`                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `e2e`    | checkout repo backend มาด้วย (`Pattaradanai888/CompetencyX-Backend` branch `main`), migrate + `sync_content` บน SQLite, start gunicorn ที่ :8000, build แล้ว start Nuxt ที่ :3000 ชี้ไปที่ backend นั้น, ติดตั้ง Chromium, แล้วรัน `pnpm test:e2e` ด้วย Playwright จริง — ครอบคลุม smoke ของ Role Discovery, การทำ Skill Assessment จนจบด้วย role ที่รู้อยู่แล้ว, และการสมัครบัญชีแล้วทำเครื่องหมาย/ยกเลิกหัวข้อที่รู้แล้ว ถ้า step ไหนพัง จะเก็บ screenshot ไว้ใน `test-results/` และอัปโหลดเป็น artifact |
| `docker` | build image จาก `Dockerfile` โดยไม่ push                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

ตั้งค่าเพิ่มได้ผ่าน repository variables/secrets: `BACKEND_REPOSITORY`, `BACKEND_REF` (เปลี่ยน branch ของ backend ที่ใช้ทดสอบ) และ `BACKEND_REPO_TOKEN` (จำเป็นเฉพาะกรณี repo backend เป็น private)

---

## 4. การต่อกับ backend

ทุก request วิ่งผ่าน `useApiClient()` (`app/composables/useApiClient.ts`) ซึ่งเติม `runtimeConfig.public.apiBase` ให้อัตโนมัติ
ถ้าจะเปลี่ยนปลายทาง API ให้แก้ที่ env ตัวเดียว ไม่ต้องไล่แก้ในโค้ด

endpoint ที่หน้าเว็บเรียกอยู่ตอนนี้

บัญชีผู้ใช้ (token ที่ได้จะถูกเก็บใน cookie `cx-account-token` และแนบเป็น `Authorization: Token …` ทุก request)

- `POST /api/v1/accounts/register/`
- `POST /api/v1/accounts/sign-in/`
- `POST /api/v1/accounts/sign-out/`
- `GET  /api/v1/accounts/me/`

Catalog และ Role Discovery

- `GET  /api/v1/catalog/roles/`
- `GET  /api/v1/catalog/roles/{slug}/topics/`
- `GET  /api/v1/catalog/roles/{slug}/roadmap/`
- `POST /api/v1/assessment-sessions/`
- `GET  /api/v1/assessment-sessions/{id}/`
- `POST /api/v1/assessment-sessions/{id}/answers/`
- `GET  /api/v1/assessment-sessions/{id}/results/`

Skill Assessment (backend เป็นผู้ตัดสินว่าถามข้อไหนต่อและหยุดเมื่อไร ตาม ADR-0005; การทำเครื่องหมายว่ารู้หัวข้อแล้วต้องมีบัญชี)

- `GET  /api/v1/assessment-sessions/{id}/skill-assessment/catalog/`
- `POST /api/v1/assessment-sessions/{id}/skill-assessment/next-question/`
- `GET|POST /api/v1/assessment-sessions/{id}/skill-assessment/`
- `POST /api/v1/assessment-sessions/{id}/skill-assessment/held-topics/`
- `DELETE /api/v1/assessment-sessions/{id}/skill-assessment/held-topics/{topic_key}/`

รายละเอียด payload ดูที่ `frontend-integration.md` และ `openapi.json` ใน repo นี้ (snapshot จาก backend)

### 4.1 รัน e2e ในเครื่อง

e2e ใน `test/e2e/` ขับเบราว์เซอร์จริง (Playwright) ใส่ FE ที่ต่อกับ BE จริง จึงต้องมีทั้งคู่รันอยู่ก่อน ชุดทดสอบจะสร้างเซสชันและบัญชีทดสอบขึ้นใน backend ที่ชี้ไป จึงควรใช้ฐานข้อมูลสำหรับทดสอบ (เช่น `DJANGO_SQLITE_NAME=e2e.sqlite3`) ไม่ใช่ฐานข้อมูลที่ใช้งานจริง

```powershell
# terminal 1: backend (ดู README ของ repo backend) ให้อยู่ที่ :8000 และ sync_content แล้ว
# terminal 2: frontend แบบ production build
pnpm build
node .output/server/index.mjs

# terminal 3
pnpm exec playwright-core install chromium        # ครั้งแรกครั้งเดียว
$env:E2E_BASE_URL = 'http://127.0.0.1:3000'
$env:E2E_API_BASE = 'http://127.0.0.1:8000'
pnpm test:e2e
```

ถ้าไม่ตั้ง `E2E_BASE_URL` ชุด e2e จะ skip ตัวเอง `pnpm test` จึงรันได้ตามปกติในเครื่องที่ไม่มี server เปิดอยู่

---

## 5. โครงสร้างหน้า

| Route                        | ไฟล์                                      | ทำอะไร                                               |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `/`                          | `app/pages/index.vue`                     | หน้าแรก                                              |
| `/assessment/start`          | `app/pages/assessment/start.vue`          | เริ่มทำแบบประเมิน                                    |
| `/assessment/preferred-role` | `app/pages/assessment/preferred-role.vue` | เลือก role ที่อยากไป (Role Aspiration)               |
| `/assessment/{sessionId}`    | `app/pages/assessment/[sessionId].vue`    | ตอบคำถามทีละข้อ                                      |
| `/results/{sessionId}`       | `app/pages/results/[sessionId].vue`       | สรุปผลและ recommendation                             |
| `/roadmaps/{sessionId}`      | `app/pages/roadmaps/[sessionId].vue`      | Skill Assessment แล้วต่อด้วย roadmap ของ role ที่ได้ |
| `/account/sign-in`           | `app/pages/account/sign-in.vue`           | เข้าสู่ระบบ (รองรับ `?next=` กลับไปหน้าเดิม)         |
| `/account/register`          | `app/pages/account/register.vue`          | สร้างบัญชี                                           |

โค้ดส่วนอื่น: `app/components/` (แยกตามโดเมน), `app/composables/` (เรียก API + state), `app/utils/` (logic ล้วน), `app/i18n/` (ข้อความ ไทย/อังกฤษ), `test/` (unit / nuxt / e2e)

---

## 6. Deploy ขึ้น Railway

repo นี้ deploy ด้วย `Dockerfile` (multi-stage: build ด้วย pnpm แล้วเหลือแต่ `.output` ตอนรัน) และมี `railway.json` กำหนด healthcheck ที่ `/`

### 6.1 สร้าง service

1. ไปที่ [railway.com/new](https://railway.com/new) → **Deploy from GitHub repo** → เลือก `CompetencyX-Frontend`
   (จะอยู่ project เดียวกับ backend ก็ได้ กด **+ Create** → **GitHub Repo** ใน project เดิม)
2. Settings → Networking → **Generate Domain**

### 6.2 ตั้งค่า Variables

| ตัวแปร                 | ค่าที่ใส่                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE` | URL ของ backend เช่น `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` (ใช้ variable reference ได้ถ้าอยู่ project เดียวกัน) |

`PORT` ไม่ต้องตั้ง — Nitro อ่านจาก env ที่ Railway ใส่ให้เอง และ `NUXT_PUBLIC_API_BASE` มีผลตอน runtime จึงเปลี่ยนค่าได้โดยไม่ต้อง build ใหม่

### 6.3 ฝั่ง backend ต้องยอมให้เรียก

backend ต้องเปิด CORS ให้โดเมนของ frontend — ตั้ง `DJANGO_CORS_ALLOW_ALL_ORIGINS=true` ที่ service ของ backend (หรือกำหนดโดเมนแบบเจาะจงถ้าจะรัดกุมกว่านั้น)

### 6.4 ลองรันแบบ production ในเครื่องก่อน

```powershell
pnpm build
node .output/server/index.mjs   # หรือ pnpm preview
```

---

## 7. ปัญหาที่เจอบ่อย

| อาการ                            | วิธีแก้                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| หน้าเว็บขึ้นแต่ไม่มีคำถาม / role | backend ไม่ได้รัน หรือ `NUXT_PUBLIC_API_BASE` ผิด                                |
| CORS error ใน console            | backend ยังไม่ได้เปิด `DJANGO_CORS_ALLOW_ALL_ORIGINS`                            |
| แก้ `.env` แล้วค่าไม่เปลี่ยน     | ต้องรีสตาร์ท `pnpm dev` ใหม่                                                     |
| ติดตั้ง dependencies แล้วพัง     | ลบ `node_modules` แล้ว `pnpm install --frozen-lockfile` ใหม่ อย่าใช้ npm install |
