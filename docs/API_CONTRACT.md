# ScamShield AI — API Reference

Implemented in `backend/` (Flask). In production the API and the React app are
served from the same origin; in development the API runs on `http://localhost:8000`.

- **Content type:** `application/json`
- **Errors:** `{ "success": false, "error": "<code>", "detail": "<human-readable message>" }`
- **Authentication:** `Authorization: Bearer <token>` (token from `POST /api/v1/auth/login`, valid 7 days)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | – | Service and model status |
| `POST` | `/api/predict` | optional | Fraud probability + prediction; saved to history when signed in |
| `POST` | `/api/v1/auth/register` | – | Create an account |
| `POST` | `/api/v1/auth/login` | – | Get a token |
| `GET` | `/api/v1/auth/me` | required | Current user |
| `GET` | `/api/v1/history` | required | The user's analyses (newest first) |
| `GET` | `/api/v1/history/{id}` | required | One analysis with the full submitted text |
| `DELETE` | `/api/v1/history/{id}` | required | Delete one analysis |
| `GET` | `/api/v1/dashboard/stats` | required | Counts + 8 most recent analyses |

---

## `GET /api/health`

```json
{ "status": "ok", "ready": true, "model_loaded": true, "vectorizer_loaded": true,
  "threshold": 0.55, "model_name": "ScamShield TF-IDF + Logistic Regression Group-Split Model",
  "errors": [] }
```

`ready: false` (with `errors`) when an artifact is missing or mismatched; predictions then return `503`.

## `POST /api/predict`

Request — only `job_description` is required:

```json
{
  "job_description": "Full job posting text",
  "title": "Data Entry Operator",
  "company_name": "QuickHire",
  "recruiter_email": "hr@example.com",
  "source": "WhatsApp"
}
```

`job_description` and `title` (plus any other training column from
`model_metadata.json`, e.g. `company_profile`) are fed to the model.
`company_name`, `recruiter_email` and `source` are only stored for history.

Response `200`:

```json
{
  "success": true,
  "prediction": "Fraudulent",
  "label": "Potentially Fraudulent",
  "is_fraudulent": true,
  "fraud_probability": 0.687,
  "threshold": 0.55,
  "disclaimer": "This is a statistical estimate ...",
  "saved": true,
  "id": 42,
  "created_at": "2026-10-14T08:57:12.345678Z"
}
```

- `fraud_probability` = `predict_proba` for class `1` (fraudulent), rounded to 4 decimals.
- `is_fraudulent` = `fraud_probability >= threshold`. There are only two outcomes.
- `saved`, `id`, `created_at`: present/true only when a valid token was sent.

Errors: `400` invalid input · `401` token sent but invalid/expired · `503` model unavailable · `500` prediction failed.

## Authentication

`POST /api/v1/auth/register` — `{ "full_name", "email", "password" }`
→ `201 { "success": true, "user": { "id", "full_name", "email", "created_at" } }`

Password: 8–128 characters with at least one letter and one number. Email is
stored lower-cased. `409` if the email is already registered.

`POST /api/v1/auth/login` — `{ "email", "password" }`
→ `200 { "success": true, "user": {...}, "token": "...", "expires_in": 604800 }`

`401 "Invalid email or password."` for any wrong combination (the same message
whether or not the email exists). After 10 failed attempts for one email
within 15 minutes: `429`.

## History

`GET /api/v1/history?page=1&page_size=20&search=&prediction=&sort=newest`

- `page_size` max 100 · `search` matches job title or company ·
  `prediction` = `fraudulent` | `legitimate` · `sort` = `newest` | `oldest`

```json
{
  "items": [
    { "id": 42, "job_title": "...", "company_name": "...", "source": "WhatsApp",
      "prediction": "Fraudulent", "label": "Potentially Fraudulent", "is_fraudulent": true,
      "fraud_probability": 0.687, "threshold": 0.55, "created_at": "..." }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 1 }
}
```

`GET /api/v1/history/{id}` → `{ "analysis": { ...item, "recruiter_email": "...", "description": "full text" } }`

`DELETE /api/v1/history/{id}` → `{ "success": true, "id": 42 }`

Another user's id returns `404` (its existence is not revealed).

## `GET /api/v1/dashboard/stats`

```json
{ "total_analyzed": 2, "fraudulent": 1, "legitimate": 1, "recent_analyses": [ ...items ] }
```
