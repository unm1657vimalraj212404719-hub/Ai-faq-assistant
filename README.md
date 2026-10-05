# AI FAQ Assistant

Node.js + Express + MongoDB REST API with JWT auth and Google Gemini FAQ generation.

## Setup
```bash
npm install
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

## Endpoints
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/profile | Private |
| GET | /api/faqs?page=&limit=&category= | Public |
| GET | /api/faqs/search?q=configure | Public |
| GET | /api/faqs/categories | Public |
| GET | /api/faqs/:id | Public |
| POST | /api/faqs | Private |
| PUT | /api/faqs/:id | Owner / Admin |
| DELETE | /api/faqs/:id | Owner / Admin |
| POST | /api/ai/generate-faq `{ "topic": "...", "save": true }` | Private |
| POST | /api/ai/answer `{ "question": "..." }` | Private |

Send `Authorization: Bearer <token>` on private routes.
To make an admin, set `role: "admin"` on the user document in MongoDB.
