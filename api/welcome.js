const { createCanvas, loadImage } = require('canvas');

module.exports = async (req, res) => {
  try {
    const { user = 'User', gender = 'cowok', avatar } = req.query;
    
    // Tentukan background berdasarkan gender
    const isCewe = String(gender).toLowerCase().includes('cewe');
    const bgUrl = isCewe 
      ? 'https://raw.githubusercontent.com/levi900628/projecttest/main/assets/welcome-cewek.jpg'
      : 'https://raw.githubusercontent.com/levi900628/projecttest/main/assets/welcome-cowok.jpg';

    // Buat canvas berukuran 1536x865
    const canvas = createCanvas(1536, 865);
    const ctx = canvas.getContext('2d');

    // Load background
    try {
      const background = await loadImage(bgUrl);
      ctx.drawImage(background, 0, 0, 1536, 865);
    } catch (e) {
      // Fallback warna jika gambar background belum ada
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 1536, 865);
    }

    // Load dan gambar avatar di kotak putih (koordinat x:90, y:275, ukuran 315x315)
    if (avatar) {
      try {
        const avatarImage = await loadImage(decodeURIComponent(avatar));
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(90, 275, 315, 315, 40);
        } else {
          ctx.rect(90, 275, 315, 315);
        }
        ctx.clip();
        ctx.drawImage(avatarImage, 90, 275, 315, 315);
        ctx.restore();
      } catch (err) {
        console.error('Gagal memuat avatar:', err);
      }
    }

    // Tulis teks nama user di atas kartu jika diperlukan
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`@${user}`, 450, 340);

    // Kirim hasil gambar ke WhatsApp / browser sebagai PNG
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

