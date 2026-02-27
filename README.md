
# BiteSpeed Backend Task – Identity Reconciliation

## Project Overview

This project implements an **Identity Reconciliation Service**.

The service exposes a POST `/identify` endpoint that:

- Accepts `email` and/or `phoneNumber`
- Links related contacts
- Maintains a primary contact
- Converts primaries to secondary when required
- Merges multiple identity groups
- Returns a consolidated contact response

---

## 🛠 Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Postman (for API testing)

---

## Project Structure
```
bitespeed-identity/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── app.ts
│   └── server.ts
│
├── prisma.config.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md

```
---

#  How To Run This Project On A New Device

Follow these steps carefully:

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bitespeed-identity
````

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Setup PostgreSQL

Make sure PostgreSQL is installed and running.

Create a new database:

```sql
CREATE DATABASE bitespeed;
```

---

## 4. Configure Environment Variables

Create a `.env` file in root directory:

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bitespeed"
```

Replace:

* `postgres` → your DB username
* `yourpassword` → your DB password

---

## 5. Prisma Setup

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

If drift occurs during development:

```bash
npx prisma migrate reset
```

---

## 6. Start the Server

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

#  API Endpoint

## POST `/identify`

### Request Body (JSON)

```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

Both fields are optional, but at least one must be provided.

---

# Example Responses

### Case 1: New Contact

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["biffsucks@hillvalley.edu"],
    "phoneNumbers": ["717171"],
    "secondaryContactIds": []
  }
}
```

---

### Case 2: Merged Contact Groups

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "george@hillvalley.edu",
      "biffsucks@hillvalley.edu"
    ],
    "phoneNumbers": [
      "919191",
      "717171"
    ],
    "secondaryContactIds": [2]
  }
}
```

---

# API Testing Screenshots

Place the following screenshots inside a folder named:

```
/api-postman-screenshots
```

Then reference them like below:

---

### 1. Creating First Contact

![Create First Contact](api-postman-screenshots/george-919191.png)

---

### 2. Merging Primary Contacts

![Merge Contacts](api-postman-screenshots/biffsucks-717171.png)

---

### 3. Fetching Existing Primary

![Existing Primary](api-postman-screenshots/george-717171.png)

---

### 4. PostgreSQL Final Database State

![Database State](api-postman-screenshots/postgresql_bitespeed-db_Contact-Table.png)

---

# Identity Reconciliation Logic

The system works as follows:

1. Search contacts by email OR phone.
2. If none found → create primary.
3. If found:

   * Collect all related primary IDs.
   * Oldest primary remains primary.
   * Other primaries become secondary.
   * Children are relinked.
4. Only create new secondary if new information is introduced.
5. Return consolidated response.

---

# Testing

Test using Postman:

* Method: POST
* URL: `http://localhost:3000/identify`
* Body: raw → JSON

---

# Notes

* This project uses Prisma v6 configuration.
* During development, `prisma migrate reset` can be used to reset DB.
* In production, proper migration strategy should be followed.

---

#  Author

Stuti Ranjan
2026


