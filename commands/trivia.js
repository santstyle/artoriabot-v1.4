const axios = require('axios');
let triviaGames = {};

// Decode HTML entities biar teks ga aneh
function decodeHtml(html) {
    return html
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&eacute;/g, 'é')
        .replace(/&uuml;/g, 'ü')
        .replace(/&rsquo;/g, '’')
        .replace(/&ldquo;/g, '“')
        .replace(/&rdquo;/g, '”')
        .replace(/&hellip;/g, '…')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

// Fungsi acak array
function acak(array) {
    return array.sort(() => Math.random() - 0.5);
}

async function mulaiTrivia(sock, chatId) {
    if (triviaGames[chatId]) {
        sock.sendMessage(chatId, { text: '⚠️ Masih ada game trivia yang sedang berlangsung!' });
        return;
    }

    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = response.data.results[0];

        const pertanyaan = decodeHtml(data.question);
        const jawabanBenar = decodeHtml(data.correct_answer);
        const pilihan = acak([
            ...data.incorrect_answers.map(decodeHtml),
            jawabanBenar,
        ]);

        triviaGames[chatId] = {
            pertanyaan,
            jawabanBenar,
            pilihan,
            timeout: setTimeout(() => {
                sock.sendMessage(chatId, { text: `⌛ Waktu habis! Jawaban yang benar adalah: *${jawabanBenar}*` });
                delete triviaGames[chatId];
            }, 30000), // 30 detik
        };

        let daftarPilihan = '';
        pilihan.forEach((opt, i) => {
            daftarPilihan += `${i + 1}. ${opt}\n`;
        });

        sock.sendMessage(chatId, {
            text: `🎮 Trivia Time!\n\n❓ Pertanyaan: ${pertanyaan}\n\n${daftarPilihan}\n⏱️ Kamu punya 30 detik untuk menjawab!\nGunakan *.jawab <pilihan>*`
        });

    } catch (error) {
        console.error('Gagal ambil trivia:', error);
        sock.sendMessage(chatId, { text: '❌ Gagal mengambil soal trivia, coba lagi nanti.' });
    }
}

function jawabTrivia(sock, chatId, jawaban) {
    if (!triviaGames[chatId]) {
        sock.sendMessage(chatId, { text: '⚠️ Tidak ada game trivia yang sedang berlangsung.' });
        return;
    }

    const game = triviaGames[chatId];
    clearTimeout(game.timeout);

    if (
        jawaban.toLowerCase() === game.jawabanBenar.toLowerCase() ||
        jawaban === game.jawabanBenar
    ) {
        sock.sendMessage(chatId, { text: `✅ Betul! Jawabannya adalah *${game.jawabanBenar}*` });
    } else {
        sock.sendMessage(chatId, { text: `❌ Salah! Jawaban yang benar adalah *${game.jawabanBenar}*` });
    }

    delete triviaGames[chatId];
}

module.exports = { mulaiTrivia, jawabTrivia };
