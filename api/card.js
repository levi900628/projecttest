const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");

const ALLOWED_AVATAR_HOSTS = new Set([
    "pps.whatsapp.net",
    "mmg.whatsapp.net"
]);

function sendError(res, status, message) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(status).json({ error: message });
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "GET") {
            res.setHeader("Allow", "GET");
            return sendError(res, 405, "Method not allowed");
        }

        const rawAvatar = req.query.avatar;
        const requestedTemplate = req.query.template;
        const template = ["men", "women"].includes(requestedTemplate)
            ? requestedTemplate
            : (Math.random() < 0.5 ? "men" : "women");

        const templatePath = path.join(
            process.cwd(),
            "api",
            "welcome",
            `${template}.svg`
        );

        const templateBuffer = await fs.readFile(templatePath);

        // Tanpa avatar, tetap mengembalikan template agar halaman tidak kosong.
        if (rawAvatar === undefined || rawAvatar === "") {
            const output = await sharp(templateBuffer).webp().toBuffer();
            res.setHeader("Content-Type", "image/webp");
            res.setHeader("Cache-Control", "no-store, max-age=0");
            return res.status(200).send(output);
        }

        if (typeof rawAvatar !== "string") {
            return sendError(res, 400, "Avatar tidak valid");
        }

        let avatarUrl;
        try {
            avatarUrl = new URL(rawAvatar);
        } catch {
            return sendError(res, 400, "URL avatar tidak valid");
        }

        if (
            avatarUrl.protocol !== "https:" ||
            !ALLOWED_AVATAR_HOSTS.has(avatarUrl.hostname)
        ) {
            return sendError(res, 400, "URL avatar tidak diizinkan");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        let response;

        try {
            response = await fetch(avatarUrl.href, {
                signal: controller.signal,
                redirect: "error",
                headers: {
                    "User-Agent": "WelcomeCard/1.0"
                }
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return sendError(res, 502, "Gagal mengambil foto profil");
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) {
            return sendError(res, 415, "Respons avatar bukan gambar");
        }

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > 5 * 1024 * 1024) {
            return sendError(res, 413, "Foto profil terlalu besar");
        }

        const avatarBuffer = Buffer.from(await response.arrayBuffer());
        if (avatarBuffer.length === 0 || avatarBuffer.length > 5 * 1024 * 1024) {
            return sendError(res, 413, "Ukuran foto profil tidak valid");
        }

        const size = 291;
        const avatarImage = await sharp(avatarBuffer, {
            failOn: "error",
            limitInputPixels: 20_000_000
        })
            .rotate()
            .resize(size, size, {
                fit: "cover",
                position: "centre"
            })
            .webp()
            .toBuffer();

        // Bingkai putih pada template berukuran 315x315, foto dipasang di tengahnya.
        const output = await sharp(templateBuffer)
            .composite([{
                input: avatarImage,
                left: 102,
                top: 287
            }])
            .webp()
            .toBuffer();

        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "no-store, max-age=0");
        res.setHeader("X-Content-Type-Options", "nosniff");
        return res.status(200).send(output);
    } catch (err) {
        console.error("[WELCOME CARD ERROR]", err);
        return sendError(res, 500, "Gagal membuat welcome card");
    }
};
