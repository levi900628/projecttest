const { createCanvas, loadImage } = require('canvas');

module.exports = async (req, res) => {
    try {
        const { gender = 'cowok', avatar } = req.query;

        // Pilih background GitHub berdasarkan gender
        const bgUrl = (gender.toLowerCase() === 'cewek' || gender.toLowerCase() === 'cewe')
            ? 'https://raw.githubusercontent.com/levi900628/projecttest/refs/heads/main/assets/welcome-cewek.jpg'
            : 'https://raw.githubusercontent.com/levi900628/projecttest/refs/heads/main/assets/welcome-cowok.jpg';

        // Load background
        const background = await loadImage(bgUrl);
        const canvas = createCanvas(1536, 865);
        const ctx = canvas.getContext('2d');

        // Gambar background ke canvas
        ctx.drawImage(background, 0, 0, 1536, 865);

        // Jika ada parameter avatar, tempelkan ke kotak putih (koordinat disesuaikan dengan template kamu)
        if (avatar) {
            try {
                const avatarImg = await loadImage(avatar);
                ctx.save();
                ctx.beginPath();
                // Sesuaikan posisi x, y, width, height, dan radius lengkung kotak putih
                ctx.roundRect(90, 275, 315, 315, 40); 
                ctx.clip();
                ctx.drawImage(avatarImg, 90, 275, 315, 315);
                ctx.restore();
            } catch (err) {
                console.log("Gagal memuat foto profil user, melewati avatar:", err);
            }
        }

        // Kirim hasil render sebagai gambar PNG
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = canvas.toBuffer('image/png');
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("Vercel Canvas Error:", error);
        return res.status(500).send("Internal Server Error: " + error.message);
    }
};
