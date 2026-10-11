#!/bin/bash

# Creates the color constants file (already done but safe to redo)
mkdir -p autosecure/utils/constants
cat > autosecure/utils/constants/colors.js << 'EOF'
const { Colors } = require("discord.js");
const EMBED_COLORS = {
  SUCCESS:     Colors.Green,
  ERROR:       Colors.Red,
  INFO:        Colors.Blurple,
  WARNING:     Colors.Orange,
  OTP:         Colors.Purple,
  CLAIM:       Colors.Green,
  LOCKED:      Colors.DarkRed,
  TIMEOUT:     Colors.Grey,
  AUTH:        Colors.DarkBlue,
  OAUTH:       Colors.Blue,
  DISABLED:    Colors.DarkButNotBlack,
};
module.exports = { EMBED_COLORS };
EOF

echo "[+] Colors constants file ready"

# Map of hex -> EMBED_COLORS key
declare -A COLOR_MAP
COLOR_MAP["0xff0000"]="EMBED_COLORS.ERROR"
COLOR_MAP["0xFF0000"]="EMBED_COLORS.ERROR"
COLOR_MAP["0xff4757"]="EMBED_COLORS.ERROR"
COLOR_MAP["0x00ff00"]="EMBED_COLORS.SUCCESS"
COLOR_MAP["0x5865F2"]="EMBED_COLORS.INFO"
COLOR_MAP["0x5865f2"]="EMBED_COLORS.INFO"
COLOR_MAP["0x3498db"]="EMBED_COLORS.OAUTH"
COLOR_MAP["0x3498DB"]="EMBED_COLORS.OAUTH"
COLOR_MAP["0x9b59b6"]="EMBED_COLORS.OTP"
COLOR_MAP["0x9B59B6"]="EMBED_COLORS.OTP"
COLOR_MAP["0xADD8E6"]="EMBED_COLORS.INFO"
COLOR_MAP["0xb2c7e0"]="EMBED_COLORS.INFO"
COLOR_MAP["0xB8D2F0"]="EMBED_COLORS.INFO"
COLOR_MAP["0x87CEEB"]="EMBED_COLORS.INFO"
COLOR_MAP["0x808080"]="EMBED_COLORS.TIMEOUT"
COLOR_MAP["0x2f3542"]="EMBED_COLORS.TIMEOUT"
COLOR_MAP["0x747d8c"]="EMBED_COLORS.TIMEOUT"
COLOR_MAP["0xC8C8C8"]="EMBED_COLORS.TIMEOUT"
COLOR_MAP["0xc8c8c8"]="EMBED_COLORS.TIMEOUT"
COLOR_MAP["0xc8a2c8"]="EMBED_COLORS.OTP"
COLOR_MAP["0x2ecc71"]="EMBED_COLORS.CLAIM"
COLOR_MAP["0x4caf50"]="EMBED_COLORS.SUCCESS"
COLOR_MAP["0x2ed573"]="EMBED_COLORS.SUCCESS"
COLOR_MAP["0xffff00"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xFFFF00"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xffa502"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xFFA500"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xf39c12"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xffaa00"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xffa500"]="EMBED_COLORS.WARNING"
COLOR_MAP["0xe74c3c"]="EMBED_COLORS.LOCKED"
COLOR_MAP["0xE74C3C"]="EMBED_COLORS.LOCKED"
COLOR_MAP["0x1abc9c"]="EMBED_COLORS.SUCCESS"
COLOR_MAP["0x34495e"]="EMBED_COLORS.AUTH"
COLOR_MAP["0x40e0d0"]="EMBED_COLORS.SUCCESS"
COLOR_MAP["0x5f9ea0"]="EMBED_COLORS.INFO"
COLOR_MAP["0xA6C3F0"]="EMBED_COLORS.INFO"
COLOR_MAP["0x0099FF"]="EMBED_COLORS.INFO"
COLOR_MAP["0xb2c7e0"]="EMBED_COLORS.INFO"
COLOR_MAP["0x49A29F"]="EMBED_COLORS.CLAIM"

FILES=$(find autosecure -name "*.js" -type f)
TOTAL_FILES=0
TOTAL_REPLACED=0

for file in $FILES; do
  CHANGED=0
  for hex in "${!COLOR_MAP[@]}"; do
    replacement="${COLOR_MAP[$hex]}"
    
    # Match: color: 0x..., "color": 0x..., .setColor(0x...)
    if grep -q "$hex" "$file" 2>/dev/null; then
      sed -i "s/color: $hex/color: $replacement/g" "$file" 2>/dev/null
      sed -i "s/\"color\": $hex/\"color\": $replacement/g" "$file" 2>/dev/null
      sed -i "s/\.setColor($hex)/.setColor($replacement)/g" "$file" 2>/dev/null
      CHANGED=1
    fi
  done
  
  if [ "$CHANGED" = "1" ]; then
    TOTAL_FILES=$((TOTAL_FILES + 1))
    # Count how many lines changed
    CHANGES=$(grep -c 'EMBED_COLORS\.' "$file" 2>/dev/null || echo 0)
    TOTAL_REPLACED=$((TOTAL_REPLACED + CHANGES))
    
    # Add import if not already there
    IMPORT='const { EMBED_COLORS } = require("../constants/colors");'
    # Adjust path depth
    DEPTH=$(echo "$file" | tr '/' '\n' | grep -c .)
    # utils/ constants/ depth relative
    RELPATH=""
    case "$file" in
      *"/constants/"*) RELPATH="./colors" ;;
      *"/utils/"*)     RELPATH="../constants/colors" ;;
      *"/Commands/"*)  RELPATH="../../utils/constants/colors" ;;
      *"/Buttons/"*)   RELPATH="../../utils/constants/colors" ;;
      *"/modals/"*)    RELPATH="../../utils/constants/colors" ;;
      *"/events/"*)    RELPATH="../../utils/constants/colors" ;;
      *)               RELPATH="../constants/colors" ;;
    esac
    
    HEADER=$(head -1 "$file" 2>/dev/null)
    if [[ "$HEADER" != *"EMBED_COLORS"* ]]; then
      sed -i "1i const { EMBED_COLORS } = require(\"$RELPATH\");" "$file"
    fi
  fi
done

echo "[+] Done! Fixed $TOTAL_REPLACED colors in $TOTAL_FILES files"
