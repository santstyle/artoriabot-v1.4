const axios = require('axios');

async function truthCommand(sock, chatId, message) {
    try {
        const res = await axios.get('https://tod-api.vercel.app/api/truth/indonesian');
        const truth = res.data.question || res.data.truth; // tergantung response-nya
        await sock.sendMessage(chatId, {
            text: `🔥 Truth Indonesia:\n${truth}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error di truth command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Gagal ambil truth. Coba lagi nanti ya!'
        }, { quoted: message });
    }
}

module.exports = { truthCommand };
