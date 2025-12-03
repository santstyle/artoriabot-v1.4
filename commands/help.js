const settings = require('../settings');

async function menuCommand(sock, chatId, message) {
    const menuMessage = `
👑 *${settings.botName || 'Artoria Bot'}*  
Version: ${settings.version || '1.2'}  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Artoria Bot adalah bot WhatsApp multifungsi untuk membantu aktivitas grup & personal.  
Nama "Artoria" diambil dari karakter *Artoria Pendragon* dari seri Fate.  

Untuk menghubungi owner bisa gunakan command *.owner*  
atau langsung chat *SantStyle* jika ada di grup yang sama.  

Berikut menu command yang tersedia di *Artoria Bot*:  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*LANGUAGE*
• .setlang id
• .setlang en

*GENERAL*
• .owner
• .help
• .menu
• .startabsen
• .absen
• .finishabsen
• .ping
• .alive
• .joke
• .quote
• .fact
• .news
• .groupinfo
• .staff
• .weather <city>
• .lyrics <song_title>
• .ss <link>

*ADMIN*
• .antitag <on/off>
• .welcome <on/off>
• .ban @user
• .mute <minutes>
• .kick @user
• .warnings @user
• .warn @user
• .tag <message>
• .unmute
• .delete
• .antilink
• .antibadword
• .clear
• .tagall
• .hidetag
• .chatbot
• .resetlink

*IMAGE/STICKER*
• .blur <image>
• .simage <sticker>
• .sticker <image>
• .take <setwm>
• .crop <image>
• .removebg
• .remini
• .meme


*DOWNLOADER*
• .play <song_name>
• .song <song_name>
• .instagram <link>
• .video <song_name>
• .facebook <link>
• .tiktok <link>
• .ytmp4 <link>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered & Modified By SantStyle
`;

    try {
        await sock.sendMessage(chatId, { text: menuMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in menu command:', error);
        await sock.sendMessage(chatId, { text: menuMessage });
    }
}

module.exports = menuCommand;
