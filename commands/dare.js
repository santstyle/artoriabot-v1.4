const axios = require('axios');

async function dareCommand(sock, chatId, message) {
    try {
        // Ambil dare random dari API versi Indonesia
        const res = await axios.get('https://tod-api.vercel.app/api/dare/indonesian');
        const dare = res.data.question || res.data.dare; // fallback kalau field beda

        await sock.sendMessage(chatId, {
            text: `🎯 Dare Indonesia:\n${dare}`
        }, { quoted: message });

    } catch (error) {
        console.error('Error di dare command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Gagal ambil dare. Coba lagi nanti ya!'
        }, { quoted: message });
    }
}

module.exports = { dareCommand };
