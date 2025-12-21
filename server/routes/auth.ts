app.get("/api/auth/dev-login", (_req, res) => {
  const user = {
    id: "dev-user",
    email: "dev@example.com",
    name: "Dev User",
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

  res.setHeader("Set-Cookie", [
    `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800`,
  ]);

  res.json({
    success: true,
    message: "Cookie set",
  });
});