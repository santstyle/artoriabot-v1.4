const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('../lib/index');
const { delay } = require('@whiskeysockets/baileys');

async function handleWelcome(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `🎊 *PENGATURAN PESAN SELAMAT DATANG*\n
✅ *.welcome on* — Aktifkan pesan selamat datang
✅ *.welcome set [pesan]* — Atur pesan selamat datang custom
✅ *.welcome off* — Matikan pesan selamat datang

📝 *Variabel yang tersedia:*
• {user} - Mention member baru
• {group} - Nama grup
• {description} - Deskripsi grup
• {membercount} - Jumlah member grup

💡 *Contoh:*
.welcome set Selamat datang {user} di {group}! 🎉
Sekarang kita punya {membercount} member!`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Pesan selamat datang *sudah aktif*.', quoted: message });
        }
        await addWelcome(chatId, true, 'Selamat datang {user} di {group}! 🎉\nJangan lupa baca deskripsi grup ya!');
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat datang *diaktifkan* dengan pesan default.\nGunakan *.welcome set [pesan]* untuk custom pesan.',
            quoted: message
        });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Pesan selamat datang *sudah nonaktif*.', quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat datang *dinonaktifkan* untuk grup ini.',
            quoted: message
        });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, {
                text: '⚠️ Mohon berikan pesan selamat datang custom.\nContoh: *.welcome set Selamat datang {user}!*',
                quoted: message
            });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat datang custom *berhasil disetel*.\n\n📝 Pesan Anda:\n' + customMessage,
            quoted: message
        });
    }

    // Jika command tidak valid
    return sock.sendMessage(chatId, {
        text: `❌ Command tidak valid. Gunakan:\n*.welcome on* - Aktifkan\n*.welcome set [pesan]* - Set custom\n*.welcome off* - Nonaktifkan`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `👋 *PENGATURAN PESAN SELAMAT TINGGAL*\n
✅ *.goodbye on* — Aktifkan pesan selamat tinggal
✅ *.goodbye set [pesan]* — Atur pesan selamat tinggal custom
✅ *.goodbye off* — Matikan pesan selamat tinggal

📝 *Variabel yang tersedia:*
• {user} - Mention member yang keluar
• {group} - Nama grup
• {membercount} - Jumlah member grup

💡 *Contoh:*
.goodbye set Selamat tinggal {user}! 👋
Sekarang tersisa {membercount} member.`,
            quoted: message
        });
    }

    if (lower === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Pesan selamat tinggal *sudah aktif*.', quoted: message });
        }
        await addGoodbye(chatId, true, 'Selamat tinggal {user}! 👋\nSemoga sukses di mana pun!');
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat tinggal *diaktifkan* dengan pesan default.\nGunakan *.goodbye set [pesan]* untuk custom pesan.',
            quoted: message
        });
    }

    if (lower === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Pesan selamat tinggal *sudah nonaktif*.', quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat tinggal *dinonaktifkan* untuk grup ini.',
            quoted: message
        });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, {
                text: '⚠️ Mohon berikan pesan selamat tinggal custom.\nContoh: *.goodbye set Selamat tinggal {user}!*',
                quoted: message
            });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, {
            text: '✅ Pesan selamat tinggal custom *berhasil disetel*.\n\n📝 Pesan Anda:\n' + customMessage,
            quoted: message
        });
    }

    // Jika command tidak valid
    return sock.sendMessage(chatId, {
        text: `❌ Command tidak valid. Gunakan:\n*.goodbye on* - Aktifkan\n*.goodbye set [pesan]* - Set custom\n*.goodbye off* - Nonaktifkan`,
        quoted: message
    });
}

// Fungsi untuk mendapatkan jumlah member (tambahan untuk variabel {membercount})
async function getMemberCount(sock, chatId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        return groupMetadata.participants.length;
    } catch (error) {
        return '?';
    }
}

// Fungsi untuk memproses pesan welcome dengan variabel
async function processWelcomeMessage(sock, chatId, participant, welcomeMessage) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const memberCount = groupMetadata.participants.length;
        const user = participant.split('@')[0];

        let processedMessage = welcomeMessage
            .replace(/{user}/g, `@${user}`)
            .replace(/{group}/g, groupMetadata.subject)
            .replace(/{description}/g, groupMetadata.desc || 'Tidak ada deskripsi')
            .replace(/{membercount}/g, memberCount.toString());

        await sock.sendMessage(chatId, {
            text: processedMessage,
            mentions: [participant]
        });
    } catch (error) {
        console.error('Error processing welcome message:', error);
        // Fallback ke pesan sederhana
        await sock.sendMessage(chatId, {
            text: `Selamat datang @${participant.split('@')[0]} di grup! 🎉`,
            mentions: [participant]
        });
    }
}

// Fungsi untuk memproses pesan goodbye dengan variabel
async function processGoodbyeMessage(sock, chatId, participant, goodbyeMessage) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const memberCount = groupMetadata.participants.length;
        const user = participant.split('@')[0];

        let processedMessage = goodbyeMessage
            .replace(/{user}/g, `@${user}`)
            .replace(/{group}/g, groupMetadata.subject)
            .replace(/{membercount}/g, memberCount.toString());

        await sock.sendMessage(chatId, {
            text: processedMessage,
            mentions: [participant]
        });
    } catch (error) {
        console.error('Error processing goodbye message:', error);
        // Fallback ke pesan sederhana
        await sock.sendMessage(chatId, {
            text: `Selamat tinggal @${participant.split('@')[0]}! 👋`,
            mentions: [participant]
        });
    }
}

module.exports = {
    handleWelcome,
    handleGoodbye,
    processWelcomeMessage,
    processGoodbyeMessage
};