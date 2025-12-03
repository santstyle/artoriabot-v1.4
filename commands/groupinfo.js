async function groupInfoCommand(sock, chatId, msg) {
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);

        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');

        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // Format creation date
        const creationDate = new Date(groupMetadata.creation * 1000).toLocaleDateString('id-ID');

        // Create info text yang clean tanpa emoji
        const text = `
*INFORMASI GRUP*

*Nama Grup:* ${groupMetadata.subject}
*ID Grup:* ${groupMetadata.id.split('@')[0]}
*Dibuat:* ${creationDate}

*Pemilik:* @${owner.split('@')[0]}
*Admin:* ${groupAdmins.length} orang
*Total Member:* ${participants.length}

*Deskripsi:*
${groupMetadata.desc?.toString() || 'Tidak ada deskripsi'}

${groupAdmins.length > 0 ? `*Daftar Admin:*\n${listAdmin}` : ''}
`.trim();

        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        });

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        await sock.sendMessage(chatId, {
            text: 'Gagal mengambil informasi grup!'
        });
    }
}

module.exports = groupInfoCommand;