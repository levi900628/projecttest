const sharp = require("sharp");
const path = require("path");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { avatar, gender } = req.query;

    if (!avatar) {
      return res.status(400).json({
        error: "Parameter avatar wajib diisi"
      });
    }

    const avatarUrl = new URL(avatar);

    const allowedHosts = [
      "pps.whatsapp.net",
      "mmg.whatsapp.net"
    ];

    if (
      avatarUrl.protocol !== "https:" ||
      !allowedHosts.includes(avatarUrl.hostname)
    ) {
      return res.status(400).json({
        error: "URL avatar tidak diizinkan"
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      5000
    );

    let response;

    try {
      response = await fetch(avatarUrl, {
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(502).json({
        error: "Gagal mengambil foto profil"
      });
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      return res.status(400).json({
        error: "Respons bukan gambar"
      });
    }

    const avatarBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    if (avatarBuffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        error: "Foto terlalu besar"
      });
    }

    const templateName =
      gender === "cewek" ? "women.webp" : "men.webp";

    const templatePath = path.join(
      process.cwd(),
      "api",
      "welcome",
      templateName
    );

    const size = 315;

    const avatarImage = await sharp(avatarBuffer)
      .resize(size, size, { fit: "cover" })
      .webp()
      .toBuffer();

    const output = await sharp(templatePath)
      .composite([{
        input: avatarImage,
        left: 90,
        top: 275
      }])
      .webp()
      .toBuffer();

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(output);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Gagal membuat welcome card"
    });
  }
};
