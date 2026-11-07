# Lab 2: SQLite database and CRUD routes

## Student & Course Details
- **Name:** Narala Sai Manuharsha
- **Registration Number:** 252U1R8063
- **Section:** CSE-QE-2B-204
- **Faculty:** Chintakrindi Sai Siva Teja
- **Course:** Backend Development Fundamentals (Aurora University)
- **Live link:** Not applicable

---

## 1. Overview
An Express server backed by a SQLite database (`books.db`) exposing CRUD routes for a `book` table. The database file, table, and 10 seed books are created automatically on first start. The server only starts listening after the database is ready (`initializeDBAndServer()`).

```sql
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);
```

## 2. How to Run

```bash
cd lab-02
npm install
npm run dev     # nodemon (auto-restart)
# or
npm start       # node server.js
```

- Default port is `3000`; override with `PORT=4000 npm start`.
- To reset the data, stop the server, delete `books.db`, and start again (it reseeds when the table is empty).

## 3. Endpoints

| Method | Path | Request Body | Status Code | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/books/` | – | `200` | All books, ordered by id. |
| `GET` | `/books/:bookId/` | – | `200` / `404` | Single book by id. |
| `POST` | `/books/` | `{ "title", "author", "price", "pages" }` | `201` / `400` | Adds a book; returns `{ "message": "Book Added Successfully", "bookId": <id> }`. |
| `PUT` | `/books/:bookId/` | `{ "title", "author", "price", "pages" }` | `200` / `400` / `404` | Updates a book; returns `{ "message": "Book Updated Successfully" }`. |
| `DELETE` | `/books/:bookId/` | – | `200` / `404` | Deletes a book; returns `{ "message": "Book Deleted Successfully" }`. |
| any | any unknown path | – | `404` | Catch-all: `{ "error": "Route Not Found" }`. |

## 4. Testing (curl + SQLite CLI)

```bash
curl -i http://localhost:3000/books/
```
Expected: `200 OK`, JSON array of 10 books (ids 1–10).

```bash
curl -i http://localhost:3000/books/1/
```
Expected: `200 OK`, `{"id":1,"title":"Clean Code","author":"Robert C. Martin","price":650,"pages":464}`

```bash
curl -i -X POST -H "Content-Type: application/json" -d '{"title":"Refactoring","author":"Martin Fowler","price":780,"pages":448}' http://localhost:3000/books/
```
Expected: `201 Created`, `{"message":"Book Added Successfully","bookId":11}`

```bash
curl -i -X PUT -H "Content-Type: application/json" -d '{"title":"Clean Code (2nd Edition)","author":"Robert C. Martin","price":700,"pages":470}' http://localhost:3000/books/1/
```
Expected: `200 OK`, `{"message":"Book Updated Successfully"}`

```bash
curl -i -X DELETE http://localhost:3000/books/10/
```
Expected: `200 OK`, `{"message":"Book Deleted Successfully"}`

```bash
curl -i http://localhost:3000/books/999/
```
Expected: `404 Not Found`, `{"error":"Book Not Found"}`

Verify changes directly in the database:
```bash
sqlite3 books.db "SELECT id, title, price, pages FROM book ORDER BY id;"
```
After the commands above, book 1 is "Clean Code (2nd Edition)" (700, 470), book 10 is gone, and book 11 "Refactoring" exists.

## 5. Screenshots

### GET all books
![GET all books](screenshots/get-all-books.png)

### GET single book
![GET single book](screenshots/get-single-book.png)

### POST book
![POST book](screenshots/post-book.png)

### PUT book
![PUT book](screenshots/put-book.png)

### DELETE book
![DELETE book](screenshots/delete-book.png)

### SQLite CLI verification
![SQLite CLI verification](screenshots/sqlite-cli-verify.png)

## 6. Viva Questions & Answers

### Why do we `await` the database call?
Database operations are asynchronous: `db.all`, `db.get`, and `db.run` return Promises because disk I/O takes time. `await` pauses that handler (without blocking the Node.js event loop) until the result is ready. Without it, the handler would receive a pending Promise instead of rows, and the response would be sent with wrong or empty data (or before the write finished). The same applies at startup: the server must `await` the connection and table creation before it starts listening.

### What is SQL injection and how do placeholders (`?`) prevent it?
SQL injection is an attack where user input is concatenated into a SQL string and interpreted as SQL code, e.g. `id = "1; DROP TABLE book"` built via `` `... WHERE id = ${id}` ``. With placeholders (`WHERE id = ?` and `[id]`), the SQL text is parsed first and values are bound separately as pure data, so input can never change the query structure.

### When is PUT used instead of POST?
`POST` creates a new resource; the server assigns the id (`/books/`), and repeating it creates duplicates. `PUT` replaces/updates an existing resource at a known URL (`/books/:bookId/`) and is idempotent: sending the same request repeatedly leaves the same final state.

## 7. Notes: Common Issues & Solutions

- **Asynchronous startup order:** If `app.listen()` runs before the DB connection is ready, early requests hit an undefined `db`. *Solution:* initialize the DB and start listening inside `initializeDBAndServer()` only after success; exit on failure.
- **Parameter sanitization:** Never build SQL with template strings. *Solution:* always use `?` placeholders; also validate the body (`title`/`author` non-empty strings, `price`/`pages` integers) and return `400` otherwise.
- **Data types:** SQLite is loosely typed, so sending `"price": "abc"` could be stored silently. *Solution:* validate types in the route before inserting. (No foreign keys are used in this lab; if added, run `PRAGMA foreign_keys = ON;` per connection since SQLite disables them by default.)
- **Missing `Content-Type` header:** Without `-H "Content-Type: application/json"`, `req.body` is empty and the request returns `400`.
- **Port in use (`EADDRINUSE`):** Find it with `lsof -i :3000` and kill it, or use another `PORT`.
- **404 middleware order:** The catch-all must be registered after all routes, or it shadows them.
