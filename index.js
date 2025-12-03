require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')

// === TAMBAHKAN KODE FFMPEG DI SINI ===
const { exec } = require('child_process');
const path = require('path'); // <-- INI SATU-SATUNYA DEKLARASI PATH

// Set FFmpeg path to local folder
const ffmpegPath = path.join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe');
const ffprobePath = path.join(__dirname, 'ffmpeg', 'bin', 'ffprobe.exe');

// Override global FFmpeg path
process.env.FFMPEG_PATH = ffmpegPath;
process.env.FFPROBE_PATH = ffprobePath;
process.env.PATH = `${path.join(__dirname, 'ffmpeg', 'bin')}${path.delimiter}${process.env.PATH}`;

console.log('FFmpeg path set to:', ffmpegPath);

// Test FFmpeg installation
exec(`"${ffmpegPath}" -version`, (error, stdout, stderr) => {
    if (error) {
        console.log('❌ FFmpeg not found:', error.message);
        console.log('Please download FFmpeg and extract to ./ffmpeg/ folder');
    } else {
        console.log('✅ FFmpeg installed successfully!');
        console.log('FFmpeg version:', stdout.split('\n')[0]);
    }
});
// === END TAMBAHAN FFMPEG ===

const FileType = require('file-type')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path') // <-- INI MASIH BOLEH KARENA join SAJA

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('RAM too high (>400MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "Artoria Bot V1"
global.themeemoji = "•"

// Function to clear old session data
function clearOldSessionData() {
    try {
        const sessionDir = './session';
        if (existsSync(sessionDir)) {
            // Check if session is older than 1 day to force refresh
            const stats = fs.statSync(sessionDir);
            const now = new Date();
            const sessionAge = now - stats.mtime;
            const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds

            if (sessionAge > oneDay) {
                console.log('Clearing old session data...');
                rmSync(sessionDir, { recursive: true, force: true });
                console.log('Old session cleared successfully');
            }
        }
    } catch (error) {
        console.log('No old session to clear or error clearing:', error.message);
    }
}

async function startXeonBotInc() {
    // Clear old session data before starting
    clearOldSessionData();

    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const msgRetryCounterCache = new NodeCache()

    // Simple logger configuration without transport
    const logger = pino({
        level: 'error',
        timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`
    })

    const XeonBotInc = makeWASocket({
        version,
        logger: logger,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "error" })),
        },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            try {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            } catch (error) {
                console.log('Error loading message from store:', error.message)
                return ""
            }
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 30000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 250,
        fireInitQueries: true,
        emitOwnEvents: true,
        defaultCacheSize: 100
    })

    store.bind(XeonBotInc.ev)

    // Message handling with better error management
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            // Skip if no messages
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;

            const mek = chatUpdate.messages[0]
            if (!mek.message) return

            // Handle ephemeral messages
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message

            // Handle status updates
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }

            // Skip if not public and not from me
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return

            // Skip specific message IDs
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache periodically to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                if (Math.random() < 0.01) {
                    XeonBotInc.msgRetryCounterCache.clear()
                }
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err.message)
                if (mek.key && mek.key.remoteJid && !err.message.includes('Bad MAC') && !err.message.includes('decrypt')) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: 'An error occurred while processing your message.'
                    }).catch(console.error);
                }
            }
        } catch (err) {
            if (!err.message.includes('Bad MAC') && !err.message.includes('decrypt')) {
                console.error("Error in messages.upsert:", err.message)
            }
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Connection handling with better QR management
    const qrcode = require('qrcode-terminal')
    let connectionAttempts = 0;
    const maxConnectionAttempts = 5;

    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s

        if (qr) {
            console.log('\n=== NEW QR CODE ===')
            qrcode.generate(qr, { small: true })
            console.log('Scan QR ini pakai WhatsApp app kamu\n')
            connectionAttempts = 0;
        }

        if (connection === 'open') {
            console.log('Bot connected successfully!')
            connectionAttempts = 0;
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const errorMessage = lastDisconnect?.error?.message || ''

            console.log(`Connection closed. Status: ${statusCode}, Attempt: ${connectionAttempts + 1}/${maxConnectionAttempts}`)

            if (!errorMessage.includes('Bad MAC') && !errorMessage.includes('decrypt')) {
                console.log('Disconnect reason:', errorMessage)
            }

            connectionAttempts++;

            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('Session logged out. Clearing session data...')
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch (error) {
                    console.log('Error clearing session:', error.message)
                }
                await delay(3000)
                startXeonBotInc()
            } else if (connectionAttempts <= maxConnectionAttempts) {
                console.log(`Reconnecting... (${connectionAttempts}/${maxConnectionAttempts})`)
                await delay(5000)
                startXeonBotInc()
            } else {
                console.log('Max connection attempts reached. Please restart manually.')
            }
        }
    })

    XeonBotInc.ev.on('creds.update', saveCreds)

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        try {
            await handleGroupParticipantUpdate(XeonBotInc, update);
        } catch (error) {
            console.error('Error in group participants update:', error.message)
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        try {
            await handleStatus(XeonBotInc, status);
        } catch (error) {
            console.error('Error handling status update:', error.message)
        }
    });

    return XeonBotInc
}

// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error on startup:', error)
    setTimeout(() => {
        console.log('Restarting bot...')
        startXeonBotInc()
    }, 10000)
})

process.on('uncaughtException', (err) => {
    if (!err.message.includes('Bad MAC') && !err.message.includes('decrypt')) {
        console.error('Uncaught Exception:', err)
    }
})

process.on('unhandledRejection', (err) => {
    if (!err.message?.includes('Bad MAC') && !err.message?.includes('decrypt')) {
        console.error('Unhandled Rejection:', err)
    }
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})