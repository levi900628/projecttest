module.exports = (req, res) => {
  const gender = req.query.gender === "cewek"
    ? "women"
    : "men";

  const title = gender === "women"
    ? "Welcome, Queen!"
    : "Welcome, King!";

  const image =
    `https://projecttest-eosin-eight.vercel.app/api/welcome/${gender}.webp`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");

  res.status(200).send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Member baru telah bergabung!">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${image}">
  <meta property="og:image:type" content="image/webp">
  <meta property="og:url" content="https://projecttest-eosin-eight.vercel.app/api/welcome?gender=${gender === "women" ? "cewek" : "cowok"}">
</head>
<body>
  <h1>${title}</h1>
  <p>Member baru telah bergabung!</p>
  <img src="${image}" alt="Welcome card" style="max-width:100%">
</body>
</html>`);
};
