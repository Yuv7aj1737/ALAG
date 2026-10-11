const { Colors } = require("discord.js");

const EMBED_COLORS = {
  SUCCESS:     Colors.Green,       // 0x57F287
  ERROR:       Colors.Red,         // 0xED4245
  INFO:        Colors.Blurple,     // 0x5865F2
  WARNING:     Colors.Orange,      // 0xE67E22
  OTP:         Colors.Purple,      // 0x9B59B6
  CLAIM:       Colors.Green,       // 0x57F287
  LOCKED:      Colors.DarkRed,     // 0x992D22
  TIMEOUT:     Colors.Grey,        // 0x95A5A6
  AUTH:        Colors.DarkBlue,    // 0x206694
  OAUTH:       Colors.Blue,        // 0x3498DB
  DISABLED:    Colors.DarkButNotBlack, // 0x2C2F33
};

const { NEON_COLORS, BASIC_COLORS } = require("./colorlibrary");

module.exports = { EMBED_COLORS, NEON_COLORS, BASIC_COLORS };

