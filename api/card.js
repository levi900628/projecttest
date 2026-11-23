const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { avatar } = req.query;
    let { gender } = req.query;

    if (!avatar) {
      return res.status(400).json({
        error: "Parameter avatar wajib diisi"
      });
    }

    // Validasi URL foto profil WhatsApp
    let avatarUrl;

    try {
      avatarUrl = new URL(avatar);
    } catch {
      return res.status(400).json({
        error: "URL avatar tidak valid"
      });
    }

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

    // Pilih template SVG asli
    const normalizedGender = String(gender || "").toLowerCase();

    if (["male", "man", "cowok", "laki-laki"].includes(normalizedGender)) {
      gender = "men";
    } else if (
      ["female", "woman", "cewek", "perempuan"].includes(normalizedGender)
    ) {
      gender = "women";
    } else {
      gender = Math.random() < 0.5 ? "men" : "women";
    }
    const templatePath = path.join(
  process.cwd(),
  "public",
  "welcome",
  `${gender}.svg`
);
    // Baca SVG dari folder milik lu, bukan template manual
    const templateBuffer = await fs.readFile(templatePath);
    const metadata = await sharp(templateBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Ukuran template SVG tidak valid");
    }

    // Ambil avatar
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response;

    try {
      response = await fetch(avatarUrl.href, {
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
        error: "Avatar bukan gambar"
      });
    }

    const avatarBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    if (
      avatarBuffer.length === 0 ||
      avatarBuffer.length > 5 * 1024 * 1024
    ) {
      return res.status(413).json({
        error: "Ukuran avatar tidak valid atau terlalu besar"
      });
    }

    // Posisi kotak avatar pada desain SVG 700 × 700.
    // Sesuaikan kalau ukuran atau posisi kotak di SVG lu berbeda.
    const scale = metadata.width / 700;
    const size = Math.round(291 * scale);
    const left = Math.round(102 * scale);
    const top = Math.round(287 * scale);

    const avatarImage = await sharp(avatarBuffer)
      .resize(size, size, {
        fit: "cover",
        position: "centre"
      })
      .png()
      .toBuffer();

    // Tempelkan avatar di atas template SVG asli
    const output = await sharp(templateBuffer)
      .composite([
        {
          input: avatarImage,
          left,
          top
        }
      ])
      .webp()
      .toBuffer();

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(output);
  } catch (err) {
    console.error("[CARD ERROR]", err);

    return res.status(500).json({
      error: "Gagal membuat welcome card"
    });
  }
};
