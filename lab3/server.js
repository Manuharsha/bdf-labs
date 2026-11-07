const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = process.env.VERCEL ? ':memory:' : path.join(__dirname, 'books.db');

let db = null;

// Middleware: JSON body parser
app.use(express.json());

// Middleware: Request logging (sensitive fields like passwords/tokens are masked or omitted)
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

// Seed data
const initialBooks = [
  ['Clean Code', 'Robert C. Martin', 650],
  ['The Pragmatic Programmer', 'Andrew Hunt', 720],
  ['Introduction to Algorithms', 'Thomas H. Cormen', 1200],
  ['Design Patterns', 'Erich Gamma', 850],
  ['JavaScript: The Good Parts', 'Douglas Crockford', 450],
  ['You Dont Know JS', 'Kyle Simpson', 550],
  ['Database System Concepts', 'Abraham Silberschatz', 950],
  ['Computer Networks', 'Andrew S. Tanenbaum', 890],
  ['Operating System Concepts', 'Peter B. Galvin', 920],
  ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', 1150]
];

// Helper validator for POST / PUT payload
function validateBookPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: "Request body must be a JSON object" };
  }
  const { title, author, price } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return { valid: false, message: "Field 'title' is required and must be a non-empty string" };
  }
  if (typeof author !== 'string' || author.trim() === '') {
    return { valid: false, message: "Field 'author' is required and must be a non-empty string" };
  }
  if (price === undefined || price === null || typeof price !== 'number' || isNaN(price) || price < 0) {
    return { valid: false, message: "Field 'price' is required and must be a valid non-negative numeric value" };
  }

  return {
    valid: true,
    data: {
      title: title.trim(),
      author: author.trim(),
      price: Number(price)
    }
  };
}

/**
 * 1. GET /books
 * Query parameters:
 *  - search_q: partial title match (LIKE %...%)
 *  - min_price: minimum price filter (price >= ?)
 *  - max_price: maximum price filter (price <= ?)
 *  - order_by: column to order by (id, title, author, price). Default: id
 *  - order: ASC or DESC. Default: ASC
 *  - limit: pagination limit. Default: 10
 *  - offset: pagination offset. Default: 0
 */
app.get('/books', async (req, res) => {
  try {
    const {
      search_q = '',
      min_price,
      max_price,
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0'
    } = req.query;

    const conditions = [];
    const params = [];

    // Search query on title (LIKE)
    if (search_q.trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${search_q.trim()}%`);
    }

    // min_price filter
    if (min_price !== undefined && min_price !== '') {
      const minVal = Number(min_price);
      if (isNaN(minVal)) {
        return res.status(400).json({ message: "Invalid 'min_price' parameter. Must be numeric." });
      }
      conditions.push('price >= ?');
      params.push(minVal);
    }

    // max_price filter
    if (max_price !== undefined && max_price !== '') {
      const maxVal = Number(max_price);
      if (isNaN(maxVal)) {
        return res.status(400).json({ message: "Invalid 'max_price' parameter. Must be numeric." });
      }
      conditions.push('price <= ?');
      params.push(maxVal);
    }

    // Whitelist allowed order_by columns to prevent SQL injection
    const allowedOrderBy = ['id', 'title', 'author', 'price'];
    const sanitizedOrderBy = allowedOrderBy.includes(order_by.toLowerCase())
      ? order_by.toLowerCase()
      : 'id';

    // Whitelist sort direction
    const sanitizedOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Validate limit and offset
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid 'limit' parameter. Must be a positive integer." });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ message: "Invalid 'offset' parameter. Must be a non-negative integer." });
    }

    let sql = 'SELECT * FROM books';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY ${sanitizedOrderBy} ${sanitizedOrder} LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(sql, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

/**
 * 2. GET /books/:id
 * Retrieve a single book by its primary key ID
 */
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const book = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({ message: `Book with id ${id} not found` });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

/**
 * 3. POST /books
 * Create a new book record
 */
app.post('/books', async (req, res) => {
  try {
    const validation = validateBookPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { title, author, price } = validation.data;
    const result = await db.run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [title, author, price]
    );

    const newBook = await db.get('SELECT * FROM books WHERE id = ?', [result.lastID]);
    res.status(201).json({
      message: "Book created successfully",
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

/**
 * 4. PUT /books/:id
 * Update an existing book's details
 */
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with id ${id} not found` });
    }

    const validation = validateBookPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { title, author, price } = validation.data;
    await db.run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [title, author, price, id]
    );

    const updatedBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook
    });
  } catch (error) {
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

/**
 * 5. DELETE /books/:id
 * Remove a book by its primary key ID
 */
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with id ${id} not found` });
    }

    await db.run('DELETE FROM books WHERE id = ?', [id]);
    res.status(200).json({
      message: `Book with id ${id} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

// Catch-all 404 handler for unknown paths
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Database initialization and server boot
// Database initialization and server boot
async function initializeDBAndServer() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL
      );
    `);

    // Auto-seed if books table is empty
    const { count } = await db.get('SELECT COUNT(*) AS count FROM books');
    if (count === 0) {
      for (const item of initialBooks) {
        await db.run(
          'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
          item
        );
      }
      console.log(`Database seeded with ${initialBooks.length} initial books.`);
    }

    // Only start the local server if we are NOT on Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize database or start server:', error.message);
    process.exit(1);
  }
}

initializeDBAndServer();

// Export the Express app so Vercel can run it serverless
module.exports = app;
