const SITE_URL = "https://projecttest-eosin-eight.vercel.app";

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "GET") {
            res.setHeader("Allow", "GET");
            return res.status(405).send("Method not allowed");
        }

        const rawAvatar = req.query.avatar;
        let avatar = null;

        if (rawAvatar !== undefined && rawAvatar !== "") {
            if (typeof rawAvatar !== "string") {
                return res.status(400).send("Avatar tidak valid");
            }

            let parsed;
            try {
                parsed = new URL(rawAvatar);
            } catch {
                return res.status(400).send("URL avatar tidak valid");
            }

            const allowedHosts = ["pps.whatsapp.net", "mmg.whatsapp.net"];
            if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname)) {
                return res.status(400).send("Avatar tidak diizinkan");
            }

            avatar = parsed.href;
        }

        const requestedTemplate = req.query.template;
        const template = ["men", "women"].includes(requestedTemplate)
            ? requestedTemplate
            : (Math.random() < 0.5 ? "men" : "women");

        const imageUrl = new URL("/api/card", SITE_URL);
        imageUrl.searchParams.set("template", template);
        if (avatar) imageUrl.searchParams.set("avatar", avatar);

        const pageUrl = new URL("/api/intro", SITE_URL);
        pageUrl.searchParams.set("template", template);
        if (avatar) pageUrl.searchParams.set("avatar", avatar);

        const safeImageUrl = escapeHtml(imageUrl.href);
        const safePageUrl = escapeHtml(pageUrl.href);

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store, max-age=0");
        res.setHeader("X-Content-Type-Options", "nosniff");

        return res.status(200).send(`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome</title>
<meta name="description" content="Welcome card anggota baru.">
<meta property="og:type" content="website">
<meta property="og:title" content="Welcome">
<meta property="og:description" content="Welcome card anggota baru.">
<meta property="og:url" content="${safePageUrl}">
<meta property="og:image" content="${safeImageUrl}">
<meta property="og:image:secure_url" content="${safeImageUrl}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="900">
<meta property="og:image:height" content="900">
<meta property="og:image:alt" content="Welcome card anggota baru">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Welcome">
<meta name="twitter:description" content="Welcome card anggota baru.">
<meta name="twitter:image" content="${safeImageUrl}">
<style>
*{box-sizing:border-box}
body{margin:0;padding:24px;background:#10131d;color:#f7f7fb;font-family:system-ui,Arial,sans-serif;text-align:center}
main{max-width:720px;margin:0 auto}
img{display:block;width:100%;height:auto;margin:22px auto 0;border-radius:18px}
p{color:#b8bfd4}
</style>
</head>
<body>
<main>
<h1>Welcome</h1>
<p>Welcome card anggota baru.</p>
<img src="${safeImageUrl}" alt="Welcome card anggota baru">
</main>
</body>
</html>`);
    } catch (err) {
        console.error("[INTRO PAGE ERROR]", err);
        return res.status(500).send("Gagal membuat halaman intro");
    }
};
