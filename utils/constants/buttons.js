const { ButtonStyle } = require("discord.js");

const BUTTONS = {
  CANCEL:       { label: "🚫 Cancel",      style: ButtonStyle.Danger,     id: "cancel_session" },
  RETRY:        { label: "🔄 Retry",       style: ButtonStyle.Secondary,  id: "retry_stage" },
  CONTINUE:     { label: "▶ Continue",     style: ButtonStyle.Primary,    id: "stage_continue" },
  RESEND:       { label: "📧 Resend Code", style: ButtonStyle.Secondary,  id: "resend_code" },
  ENTER_CODE:   { label: "✅ Enter Code",  style: ButtonStyle.Primary,    id: "enter_code" },
  CLAIM:        { label: "🏆 Claim",       style: ButtonStyle.Success,    id: "claim_reward" },
};

module.exports = { BUTTONS };
