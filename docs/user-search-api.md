# User Search API

The frontend Explore view can run from local demo data today. When a backend is added, expose a small search endpoint that filters verified users by name or institutional email.

```http
GET /api/users/search?q=kwame&role=student
```

Example Express-style handler:

```ts
app.get('/api/users/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const role = String(req.query.role ?? 'all');
  const like = `%${q}%`;

  const users = await db.query(
    `
      SELECT id, first_name, last_name, email, role, institution
      FROM users
      WHERE verified = TRUE
        AND ($1 = '' OR LOWER(first_name || ' ' || last_name) LIKE $2 OR LOWER(email) LIKE $2)
        AND ($3 = 'all' OR role = $3)
      ORDER BY last_name ASC, first_name ASC
      LIMIT 25
    `,
    [q, like, role]
  );

  res.json(users.rows);
});
```

Response shape expected by `Explore.tsx`:

```ts
type UserSearchResult = {
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  role: 'student' | 'lecturer';
  institution?: string;
};
```
