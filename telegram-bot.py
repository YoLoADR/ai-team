#!/usr/bin/env python3
"""Telegram bot for AI Teams delegation (Cuba, Haiti, Guyane).

Routes messages from Telegram to the AI agent teams.
- Cuba (ai-team v2): OpenHands on carapace → run-agent.py
- Haiti (ai-team v1): Hermes on Precision VM 102
- Guyane (ai-hirekit): Hermes on Precision VM 102

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
SSH_VM102_CMD = ["ssh", "root@100.111.21.3", "pct", "exec", "102", "--", "bash", "-c"]
SSH_CARAPACE_HOST = "root@109.199.97.174"

# === ÉQUIPES ===

TEAMS = {
    "cuba": {
        "name": "🇨🇺 Cuba (ai-team v2 — OpenHands)",
        "server": "carapace",
        "members": {
            "po": ("Yanet", "glm-5.2:cloud", "Product Owner"),
            "dev": ("Raúl", "glm-5.2:cloud", "Developer"),
            "lead": ("Camila", "qwen3.5:397b:cloud", "Lead Developer"),
        },
    },
    "haiti": {
        "name": "🇭🇹 Haiti (ai-team v1 — Hermes)",
        "server": "vm102",
        "members": {
            "po": ("Jean-Marc", "minimax-m3:cloud", "Product Owner"),
            "dev": ("Mireille", "kimi-k2.7-code:cloud", "Developer"),
            "lead": ("Frantz", "deepseek-v4-pro:cloud", "Lead Developer"),
        },
    },
    "guyane": {
        "name": "🇬🇫 Guyane (ai-hirekit — Hermes)",
        "server": "vm102",
        "members": {
            "recon": ("Léopold", "glm-5.2:cloud", "Recon Agent"),
            "poster": ("Manon", "4 modèles A/B", "Poster Agent"),
            "review": ("Sylviane", "deepseek-v4-pro:cloud", "Review Agent"),
        },
    },
}

# Mapping legacy (transition)
LEGACY_COMMANDS = {
    "po": "cuba-po",
    "dev": "cuba-dev",
    "lead": "cuba-lead",
    "delegate": "cuba-po",
}

PROJECTS = {
    "cuba": {
        "repo": "YoLoADR/ai-team-cuba",
        "path": "/home/hermes/repo",
        "server": "carapace",
    },
    "haiti": {
        "repo": "YoLoADR/ai-team-cuba",
        "path": "/home/hermes/repo",
        "server": "vm102",
    },
    "guyane": {
        "repo": "YoLoADR/ai-hirekit",
        "path": "/home/hermes/projects/ai-hirekit",
        "server": "vm102",
    },
}

# === HELP ===


async def cmd_start(update, context):
    await update.message.reply_text(
        "🤖 *AI Teams — Caraïbes*\n\n"
        "3 équipes IA, chacune indépendante avec son moteur et ses modèles.\n\n"
        "*🇨🇺 Cuba* (OpenHands, glm-5.2 + qwen3.5)\n"
        "  `/cuba-po <msg>` — Yanet (PO)\n"
        "  `/cuba-dev <msg>` — Raúl (Dev)\n"
        "  `/cuba-lead <msg>` — Camila (Lead)\n\n"
        "*🇭🇹 Haiti* (Hermes, minimax + kimi + deepseek)\n"
        "  `/haiti-po <msg>` — Jean-Marc (PO)\n"
        "  `/haiti-dev <msg>` — Mireille (Dev)\n"
        "  `/haiti-lead <msg>` — Frantz (Lead)\n\n"
        "*🇬🇫 Guyane* (Hermes, A/B 4 modèles)\n"
        "  `/guyane-recon <msg>` — Léopold (Recon)\n"
        "  `/guyane-poster <msg>` — Manon (Poster)\n"
        "  `/guyane-review <msg>` — Sylviane (Review)\n\n"
        "*Global:*\n"
        "  `/teams` — statut des 3 équipes\n"
        "  `/motherboard` — lien Kanban unifié\n"
        "  `/status` — état détaillé (issues + PRs + VM)\n"
        "  `/help` — cette aide\n\n"
        "*Anciennes commandes* (alias, transition):\n"
        "  `/po` = `/cuba-po`, `/dev` = `/cuba-dev`, `/lead` = `/cuba-lead`",
        parse_mode="Markdown",
    )


async def cmd_help(update, context):
    await cmd_start(update, context)


# === STATUS ===


async def cmd_status(update, context):
    msg = await update.message.reply_text("⏳ Récupération de l'état...")
    try:
        # Cuba + Haiti: ai-team repo
        result = subprocess.run(
            [
                "gh",
                "issue",
                "list",
                "--repo",
                "YoLoADR/ai-team-cuba",
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
        ai_team_issues = result.stdout[:400] if result.stdout else "Aucune issue"

        result = subprocess.run(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                "YoLoADR/ai-team-cuba",
                "--state",
                "open",
                "--json",
                "number,title",
                "--limit",
                "5",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        ai_team_prs = result.stdout[:400] if result.stdout else "Aucune PR"

        # Guyane: ai-hirekit repo
        result = subprocess.run(
            [
                "gh",
                "issue",
                "list",
                "--repo",
                "YoLoADR/ai-hirekit",
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
        hirekit_issues = result.stdout[:400] if result.stdout else "Aucune issue"

        result = subprocess.run(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                "YoLoADR/ai-hirekit",
                "--state",
                "open",
                "--json",
                "number,title",
                "--limit",
                "5",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
        hirekit_prs = result.stdout[:400] if result.stdout else "Aucune PR"

        # VM 102 status
        result = subprocess.run(
            ["ssh", "root@100.111.21.3", "pct", "status", "102"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        vm = result.stdout.strip() if result.stdout else "Inaccessible"

        text = (
            f"📊 *État global*\n\n"
            f"🇨🇺 *Cuba + Haiti* (ai-team):\n"
            f"  Issues: {ai_team_issues[:200]}\n"
            f"  PRs: {ai_team_prs[:200]}\n\n"
            f"🇬🇫 *Guyane* (ai-hirekit):\n"
            f"  Issues: {hirekit_issues[:200]}\n"
            f"  PRs: {hirekit_prs[:200]}\n\n"
            f"🖥️ *VM 102:* {vm}"
        )
        await msg.edit_text(text, parse_mode="Markdown")
    except Exception as e:
        await msg.edit_text(f"❌ Erreur: {e}")


async def cmd_teams(update, context):
    text = "🌍 *AI Teams — Caraïbes*\n\n"
    for key, team in TEAMS.items():
        flag = team["name"].split(" ")[0]
        name = team["name"]
        text += f"{flag} *{key.upper()}*\n"
        for role, (prenom, modele, titre) in team["members"].items():
            text += f"  {prenom} ({titre}) — {modele}\n"
        text += "\n"
    text += (
        "🔗 *Kanban:*\n"
        "  `/motherboard` pour le lien\n\n"
        "💡 *Commandes:*\n"
        "  `/<équipe>-<rôle> <message>`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_motherboard(update, context):
    await update.message.reply_text(
        "📊 *AI Teams Motherboard*\n\n"
        "Kanban unifié — toutes les équipes sur un seul Project V2.\n\n"
        "🔗 Lien: https://github.com/users/YoLoADR/projects/N\n"
        "(Créer le Project V2 'AI Teams' puis mettre à jour ce lien)\n\n"
        "Colonnes: Backlog → Spec Ready → In Progress → In Review → Done\n"
        "Champ custom: Équipe (cuba, haiti, guyane)",
        parse_mode="Markdown",
    )


async def cmd_projects(update, context):
    text = "📁 *Projets par équipe:*\n\n"
    for name, info in PROJECTS.items():
        text += f"*{name}*\n  Repo: `{info['repo']}`\n  Path: `{info['path']}`\n  Server: `{info['server']}`\n\n"
    await update.message.reply_text(text, parse_mode="Markdown")


# === SEND TO BOT ===


async def send_to_hermes_bot(team_key, role, message, update):
    """Send to a Hermes bot on VM 102 (Haiti or Guyane)."""
    team = TEAMS[team_key]
    prenom, model, titre = team["members"][role]
    bot_name = f"{role}-bot" if team_key == "guyane" else f"{role}-bot"

    # Hermes profile name mapping
    if team_key == "haiti":
        profile = f"{role}-bot"  # po-bot, dev-bot, lead-dev-bot
        project_path = "/home/hermes/repo"
    elif team_key == "guyane":
        profile = f"{role}-bot"  # recon-bot, poster-bot, review-bot
        project_path = "/home/hermes/projects/ai-hirekit"
    else:
        return

    config = f"""approvals:
  mode: smart
model:
  api_key: f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC
  base_url: https://ollama.com/v1
  default: {model.split(" ")[0] if "A/B" not in model else "glm-5.2:cloud"}
terminal:
  backend: local
  container_persistent: true
  cwd: {project_path}
  home_mode: profile
onboarding:
  seen:
    tool_progress_prompt: true"""

    full_cmd = (
        f"cat > /home/hermes/.hermes/profiles/{profile}/config.yaml << 'ENDCFG'\n"
        f"{config}\nENDCFG\n"
        f"chown hermes:hermes /home/hermes/.hermes/profiles/{profile}/config.yaml\n"
        f'su - hermes -c "cd {project_path} && {profile} chat -q \\"{message}\\""'
    )

    ssh_cmd = SSH_VM102_CMD + [full_cmd]

    team_display = f"[{team_key}] {prenom} ({titre})"
    msg = await update.message.reply_text(
        f"⏳ {team_display} — en cours...\n⏳ Modèle: {model}"
    )

    try:
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=600)
        output = result.stdout[-3000:] if result.stdout else "Pas de sortie"
        if len(output) > 3500:
            output = output[:3500] + "\n\n... (tronqué)"
        await msg.edit_text(
            f"✅ [{team_key}] {prenom} a répondu:\n\n```\n{output}\n```",
            parse_mode="Markdown",
        )
    except subprocess.TimeoutExpired:
        await msg.edit_text(f"⏱️ Timeout — {prenom} met trop de temps.")
    except Exception as e:
        await msg.edit_text(f"❌ Erreur: {e}")


async def send_to_carapace_agent(role, message, update):
    """Send to an OpenHands agent on carapace (Cuba team)."""
    team = TEAMS["cuba"]
    prenom, model, titre = team["members"][role]

    role_map = {"po": "po", "dev": "dev", "lead": "review"}
    carapace_role = role_map.get(role, role)

    msg = await update.message.reply_text(
        f"⏳ [cuba] {prenom} ({titre}) — en cours...\n⏳ Modèle: {model}"
    )

    try:
        result = subprocess.run(
            [
                "ssh",
                "root@109.199.97.174",
                f"cd /opt/ai-team-loop && python3 run-agent.py {carapace_role} '{message}' YoLoADR/ai-team-cuba",
            ],
            capture_output=True,
            text=True,
            timeout=600,
        )
        output = result.stdout[-3000:] if result.stdout else "Pas de sortie"
        if len(output) > 3500:
            output = output[:3500] + "\n\n... (tronqué)"
        await msg.edit_text(
            f"✅ [cuba] {prenom} a répondu:\n\n```\n{output}\n```",
            parse_mode="Markdown",
        )
    except subprocess.TimeoutExpired:
        await msg.edit_text(f"⏱️ Timeout — {prenom} met trop de temps.")
    except Exception as e:
        await msg.edit_text(f"❌ Erreur: {e}")


# === COMMAND HANDLERS ===


def make_team_handler(team_key, role):
    async def handler(update, context):
        message = " ".join(context.args) if context.args else ""
        if not message:
            team = TEAMS[team_key]
            prenom, model, titre = team["members"][role]
            await update.message.reply_text(
                f"Usage: /{team_key}-{role} <message pour {prenom} ({titre})>"
            )
            return

        if team_key == "cuba":
            await send_to_carapace_agent(role, message, update)
        else:
            await send_to_hermes_bot(team_key, role, message, update)

    return handler


# === LEGACY COMMANDS (transition) ===


async def cmd_delegate(update, context):
    """Legacy /delegate → Cuba PO (Yanet)."""
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text("Usage: /delegate <description de la tâche>")
        return
    await send_to_carapace_agent("po", message, update)


async def handle_message(update, context):
    """Free-form messages — route to Cuba PO (Yanet) by default."""
    message = update.message.text
    if not message:
        return
    await send_to_carapace_agent("po", message, update)


# === MAIN ===


def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    # Global commands
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("teams", cmd_teams))
    app.add_handler(CommandHandler("motherboard", cmd_motherboard))
    app.add_handler(CommandHandler("projects", cmd_projects))

    # Cuba commands (OpenHands on carapace)
    for role in ["po", "dev", "lead"]:
        app.add_handler(CommandHandler(f"cuba-{role}", make_team_handler("cuba", role)))

    # Haiti commands (Hermes on VM 102)
    for role in ["po", "dev", "lead"]:
        app.add_handler(
            CommandHandler(f"haiti-{role}", make_team_handler("haiti", role))
        )

    # Guyane commands (Hermes on VM 102)
    for role in ["recon", "poster", "review"]:
        app.add_handler(
            CommandHandler(f"guyane-{role}", make_team_handler("guyane", role))
        )

    # Legacy commands (transition — alias to Cuba)
    app.add_handler(CommandHandler("delegate", cmd_delegate))
    app.add_handler(CommandHandler("po", make_team_handler("cuba", "po")))
    app.add_handler(CommandHandler("dev", make_team_handler("cuba", "dev")))
    app.add_handler(CommandHandler("lead", make_team_handler("cuba", "lead")))

    # Free-form messages
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("AI Teams bot starting — Cuba, Haiti, Guyane...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
