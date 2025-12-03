const fs = require('fs');
const path = require('path');

// Kalau ada file wordlist.txt, ambil dari situ, kalau gak fallback ke default
let words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs'];
const wordlistPath = path.join(__dirname, '..', 'assets', 'wordlist.txt');
if (fs.existsSync(wordlistPath)) {
    words = fs.readFileSync(wordlistPath, 'utf-8')
        .split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);
}

let hangmanGames = {};

const hangmanStages = [
    `
     +---+
     |   |
         |
         |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
         |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
     |   |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|   |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|\\  |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|\\  |
    /    |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|\\  |
    / \\  |
         |
    ========= GAME OVER!`
];

function startHangman(sock, chatId) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();

    hangmanGames[chatId] = {
        word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: hangmanStages.length - 1,
    };

    sock.sendMessage(chatId, {
        text: `🎮 Hangman Game dimulai!\n\n${maskedWord}\n\nKetik *.guess <huruf>* untuk menebak.`
    });
}

function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        sock.sendMessage(chatId, { text: '⚠️ Belum ada game. Mulai game baru dengan *.hangman*' });
        return;
    }

    letter = letter.toLowerCase();
    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: `❌ Huruf "${letter}" sudah ditebak, coba huruf lain.` });
        return;
    }

    guessedLetters.push(letter);

    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) maskedWord[i] = letter;
        }

        sock.sendMessage(chatId, {
            text: `✅ Benar! ${maskedWord.join(' ')}`
        });

        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: `🎉 Selamat! Kata yang benar adalah: *${word}*` });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses++;
        const stage = hangmanStages[game.wrongGuesses];

        sock.sendMessage(chatId, {
            text: `❌ Salah! Kamu masih punya ${maxWrongGuesses - game.wrongGuesses} kesempatan.\n${stage}`
        });

        if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, { text: `☠️ Game over! Kata yang benar adalah: *${word}*` });
            delete hangmanGames[chatId];
        }
    }
}

module.exports = { startHangman, guessLetter };
