const SITE_URL = "https://projecttest-eosin-eight.vercel.app";

module.exports = async (req, res) => {
    try {
        if (req.method !== "GET") {
            res.setHeader("Allow", "GET");
            return res.status(405).send("Method not allowed");
        }

        const avatar = req.query.avatar;
        let validAvatar = null;

        if (avatar !== undefined && avatar !== "") {
            if (typeof avatar !== "string") {
                return res.status(400).send("Avatar tidak valid");
            }

            let parsedAvatar;

            try {
                parsedAvatar = new URL(avatar);
            } catch {
                return res.status(400).send("URL avatar tidak valid");
            }

            const allowedHosts = [
                "pps.whatsapp.net",
                "mmg.whatsapp.net"
            ];

            if (
                parsedAvatar.protocol !== "https:" ||
                !allowedHosts.includes(parsedAvatar.hostname)
            ) {
                return res.status(400).send("Avatar tidak diizinkan");
            }

            validAvatar = parsedAvatar.href;
        }

        const template = Math.random() < 0.5
            ? "women"
            : "men";

        const cardUrl = new URL("/api/card", SITE_URL);
        cardUrl.searchParams.set("template", template);

        if (validAvatar) {
            cardUrl.searchParams.set("avatar", validAvatar);
        }

        const pageUrl = new URL("/api/intro", SITE_URL);

        if (validAvatar) {
            pageUrl.searchParams.set("avatar", validAvatar);
        }

        pageUrl.searchParams.set("template", template);

        const escapeHtml = value =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

        const imageUrl = escapeHtml(cardUrl.href);
        const canonicalUrl = escapeHtml(pageUrl.href);

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");

        return res.status(200).send(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Welcome</title>
    <meta name="description" content="Welcome card anggota baru.">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Welcome">
    <meta property="og:description" content="Welcome card anggota baru.">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:alt" content="Welcome card">
    <meta property="og:image:type" content="image/webp">
    <meta property="og:image:width" content="900">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Welcome">
    <meta name="twitter:description" content="Welcome card anggota baru.">
    <meta name="twitter:image" content="${imageUrl}">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 24px;
            background: #111;
            color: #fff;
            font-family: Arial, sans-serif;
            text-align: center;
        }

        main {
            max-width: 900px;
            margin: auto;
        }

        img {
            display: block;
            width: 100%;
            height: auto;
            margin-top: 24px;
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <main>
        <h1>Welcome</h1>
        <p>Welcome card anggota baru.</p>
        <img src="${imageUrl}" alt="Welcome card">
    </main>
</body>
</html>`);
    } catch (err) {
        console.error("[INTRO PAGE ERROR]", err);
        return res.status(500).send("Gagal membuat halaman intro");
    }
};
