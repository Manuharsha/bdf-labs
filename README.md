# Lab 1: Node.js and Express server

## Student & Course Details
- **Student Name:** Narala Sai Manuharsha
- **Registration Number:** 252U1R8063
- **Section:** CSE-QE-2B-204
- **Faculty:** Joel Prashanth D
- **Live link:** Not applicable

---

## 1. Project Overview
This lab demonstrates the fundamental concepts of backend web development using Node.js:
1. Setting up a plain Node.js HTTP server using the built-in `http` module (`server-http.js`).
2. Building an Express.js server (`server.js`) with structured routing, custom request-logging middleware, JSON response handling, and a 404 catch-all handler.

---

## 2. How to Run

### Prerequisites
- Node.js (v16.x or higher recommended)
- npm (Node Package Manager)

### Installation
Navigate to the `lab-01` directory and install project dependencies:
```bash
cd lab-01
npm install
```

### Environment Variables
By default, the application runs on port `3000`. You can optionally specify a custom port using the `PORT` environment variable:
```bash
PORT=4000 npm start
```

### Start Commands
- **Run the Express server (Default):**
  ```bash
  npm start
  ```
  *(or `node server.js`)*

- **Run the plain Node.js HTTP server:**
  ```bash
  npm run start:http
  ```
  *(or `node server-http.js`)*

---

## 3. Endpoints Table

| Method | Path | Status Code | Response Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `200 OK` | `text/plain` | Returns `"Welcome to BDF Lab 1 - Node.js and Express Server!"`. |
| `GET` | `/about` | `200 OK` | `application/json` | Returns JSON object with student metadata (`name`, `section`). |
| `GET` | `/time` | `200 OK` | `text/plain` | Returns plain text string representing the current date and time (`new Date().toString()`). |
| `*` (All) | *(Any undefined path)* | `404 Not Found` | `text/plain` | Catch-all handler returning plain text `"404 - Page Not Found"`. |

---

## 4. Screenshots

Place your output screenshots in the `screenshots/` directory matching the names below:

### 4.1 GET /
![GET Root](screenshots/get-root.png)

### 4.2 GET /about
![GET About](screenshots/get-about.png)

### 4.3 GET /time
![GET Time](screenshots/get-time.png)

### 4.4 GET Unknown Route (404)
![GET 404](screenshots/get-404.png)

---

## 5. Viva Questions & Detailed Answers

### Q1: What is the difference between `package.json` and `node_modules`?
- **`package.json`:**
  - A lightweight, human-readable manifest file written in JSON that records metadata about the project (name, version, scripts) along with its list of direct dependencies and versions.
  - It is checked into version control (e.g. Git) so that any collaborator or deployment environment can reproduce the exact dependency set using `npm install`.
- **`node_modules/`:**
  - A directory created automatically by npm containing the actual downloaded physical source code and binaries of all direct and transitive dependencies needed by the project.
  - Because it is typically large and platform-dependent, it should **never** be committed to Git (always placed in `.gitignore`).

### Q2: What does `app.listen()` do?
- In Express, `app.listen(port, [callback])` is a convenience wrapper around Node's standard `http.createServer(app).listen(...)`.
- It binds and listens for incoming HTTP connections on the specified port and network interface.
- Once bound, it places the Node.js event loop in a listening state ready to accept incoming TCP connections and route them to Express middleware and handlers.
- The optional callback executes once the server has successfully started listening.

### Q3: What do the `request` (`req`) and `response` (`res`) objects represent?
- **`request` (`req`):**
  - An instance of Node's `http.IncomingMessage` augmented with Express utility properties and methods.
  - Represents the HTTP request sent by the client, containing headers, query parameters (`req.query`), route parameters (`req.params`), HTTP method (`req.method`), path (`req.url` or `req.originalUrl`), client IP, and parsed body data (`req.body`).
- **`response` (`res`):**
  - An instance of Node's `http.ServerResponse` augmented with Express helper methods.
  - Used to construct and send the HTTP response back to the client. It provides methods like `res.status()`, `res.send()`, `res.json()`, `res.setHeader()`, and `res.end()`.

---

## 6. Key Fields in `package.json` Explained

- **`name`**: The unique identifier/name of the project or package (must be lowercase and URL-friendly).
- **`version`**: The current semantic version of the project (`MAJOR.MINOR.PATCH`).
- **`description`**: A short summary of what the application or package does.
- **`main`**: The entry point file of the application (e.g., `server.js`).
- **`scripts`**: A dictionary of custom CLI shortcuts and commands executed via `npm run <script-name>` (e.g., `"start": "node server.js"`).
- **`keywords`**: An array of string tags useful when publishing packages to the npm registry for search indexing.
- **`author`**: The name or contact details of the package creator/maintainer.
- **`license`**: The legal software license under which the code is released (e.g., `ISC`, `MIT`).
- **`dependencies`**: An object listing essential third-party packages required for the application to function in production (e.g. `"express": "^5.3.0"`).
- **`devDependencies`** *(optional)*: Packages only required during development or testing (e.g. testing frameworks, linters, bundlers).

---

## 7. Common Issues & Solutions

1. **Port Collisions (`EADDRINUSE`)**:
   - **Problem:** Attempting to start the server when another process is already bound to port 3000 throws an `Error: listen EADDRINUSE: address already in use :::3000`.
   - **Solution:** Either terminate the process occupying the port (`lsof -i :3000` followed by `kill -9 <PID>`) or run the application on an alternative port by passing an environment variable (e.g., `PORT=3001 npm start`).
2. **Middleware Ordering & Catch-all (404) Placement**:
   - **Problem:** Express executes middleware in the exact sequential order they are registered via `app.use()` or `app.METHOD()`. If the 404 catch-all handler is placed before standard route handlers, all incoming requests will immediately trigger a 404 response.
   - **Solution:** Always register the 404 catch-all middleware **after** all defined route definitions.
3. **Missing Asynchronous / Body Parsing Middleware**:
   - **Problem:** Attempting to read `req.body` without body parser middleware results in `undefined`.
   - **Solution:** Include `app.use(express.json())` prior to any route handlers expecting JSON payloads.

