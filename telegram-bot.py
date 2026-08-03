#!/usr/bin/env python3
"""Telegram bot for Loop Engineering team delegation.

Routes messages from Telegram to the Hermes bots on Precision (VM 102).
Runs on Contabo as a systemd service.
"""

import os
import sys
import subprocess
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
SSH_CMD = ["ssh", "root@100.111.21.3", "pct", "exec", "102", "--", "bash", "-c"]

BOTS = {
    "po": ("po-bot", "minimax-m3:cloud", "Product Owner — user stories, issues"),
    "dev": ("dev-bot", "kimi-k2.7-code:cloud", "Developer — TDD, code, PRs"),
    "lead": (
        "lead-dev-bot",
        "deepseek-v4-pro:cloud",
        "Lead Dev — review, approve, merge",
    ),
}

PROJECTS = {
    "ai-team": {"repo": "YoLoADR/ai-team", "path": "/home/hermes/repo"},
    "ai-hirekit": {
        "repo": "YoLoADR/ai-hirekit",
        "path": "/home/hermes/projects/ai-hirekit",
    },
}


async def cmd_start(update, context):
    await update.message.reply_text(
        "🤖 *Loop Engineering Team*\n\n"
        "Je suis le point d'entrée pour déléguer à l'équipe IA.\n\n"
        "*Commandes:*\n"
        "/delegate <msg> — déléguer au PO (loop complet)\n"
        "/po <msg> — parler au PO directement\n"
        "/dev <msg> — parler au Dev directement\n"
        "/lead <msg> — parler au Lead Dev directement\n"
        "/status — état de l'équipe\n"
        "/projects — lister les projets\n"
        "/help — aide\n\n"
        "*Projets:*\n"
        "ai-team, ai-hirekit\n\n"
        "*Exemple:*\n"
        "`/delegate Projet: ai-hirekit — ajoute un filtre par catégorie`",
        parse_mode="Markdown",
    )


async def cmd_help(update, context):
    await cmd_start(update, context)


async def cmd_status(update, context):
    msg = await update.message.reply_text("⏳ Récupération de l'état...")
    try:
        result = subprocess.run(
            [
                "gh",
                "issue",
                "list",
                "--repo",
                "YoLoADR/ai-team",
                "--state",
                "open",
                "--json",
                "number,title,labels",
                "--limit",
                "10",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        issues = result.stdout[:500] if result.stdout else "Aucune issue"

        result = subprocess.run(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                "YoLoADR/ai-team",
                "--state",
                "open",
                "--json",
                "number,title",
                "--limit",
                "10",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        prs = result.stdout[:500] if result.stdout else "Aucune PR"

        # VM status
        result = subprocess.run(
            ["ssh", "root@100.111.21.3", "pct", "status", "102"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        vm = result.stdout.strip() if result.stdout else "Inaccessible"

        text = f"📊 *État de l'équipe*\n\n*Issues:*\n{issues}\n\n*PRs:*\n{prs}\n\n*VM 102:* {vm}"
        await msg.edit_text(text, parse_mode="Markdown")
    except Exception as e:
        await msg.edit_text(f"❌ Erreur: {e}")


async def cmd_projects(update, context):
    text = "📁 *Projets disponibles:*\n\n"
    for name, info in PROJECTS.items():
        text += f"*{name}*\n  Repo: `{info['repo']}`\n  Path: `{info['path']}`\n\n"
    await update.message.reply_text(text, parse_mode="Markdown")


async def send_to_bot(bot_name, message, update):
    """Send a message to a Hermes bot on Precision VM 102."""
    # Clean the config first
    model = BOTS[bot_name][1]
    config = f"""approvals:
  mode: smart
model:
  api_key: f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC
  base_url: https://ollama.com/v1
  default: {model}
terminal:
  backend: local
  container_persistent: true
  cwd: /home/hermes/repo
  home_mode: profile
onboarding:
  seen:
    tool_progress_prompt: true"""

    full_cmd = f'cat > /home/hermes/.hermes/profiles/{bot_name}-bot/config.yaml << \'ENDCFG\'\n{config}\nENDCFG\nchown hermes:hermes /home/hermes/.hermes/profiles/{bot_name}-bot/config.yaml\nsu - hermes -c "cd /home/hermes/repo && {bot_name}-bot chat -q \\"{message}\\""'

    ssh_cmd = SSH_CMD + [full_cmd]

    msg = await update.message.reply_text(
        f"⏳ Envoi à {bot_name}-bot ({model})...\n⏳ Cela peut prendre plusieurs minutes."
    )

    try:
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=600)
        output = result.stdout[-3000:] if result.stdout else "Pas de sortie"
        # Truncate for Telegram (4096 char limit)
        if len(output) > 3500:
            output = output[:3500] + "\n\n... (tronqué)"
        await msg.edit_text(
            f"✅ *{bot_name}-bot a répondu:*\n\n```\n{output}\n```",
            parse_mode="Markdown",
        )
    except subprocess.TimeoutExpired:
        await msg.edit_text(
            f"⏱️ Timeout — {bot_name}-bot met trop de temps. Vérifie avec /status."
        )
    except Exception as e:
        await msg.edit_text(f"❌ Erreur: {e}")


async def cmd_delegate(update, context):
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text("Usage: /delegate <description de la tâche>")
        return
    await send_to_bot("po", message, update)


async def cmd_po(update, context):
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text("Usage: /po <message pour le PO>")
        return
    await send_to_bot("po", message, update)


async def cmd_dev(update, context):
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text("Usage: /dev <message pour le Dev>")
        return
    await send_to_bot("dev", message, update)


async def cmd_lead(update, context):
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text("Usage: /lead <message pour le Lead Dev>")
        return
    await send_to_bot("lead", message, update)


async def handle_message(update, context):
    """Handle free-form messages — route to PO by default."""
    message = update.message.text
    if not message:
        return
    await send_to_bot("po", message, update)


def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("projects", cmd_projects))
    app.add_handler(CommandHandler("delegate", cmd_delegate))
    app.add_handler(CommandHandler("po", cmd_po))
    app.add_handler(CommandHandler("dev", cmd_dev))
    app.add_handler(CommandHandler("lead", cmd_lead))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Bot starting...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
