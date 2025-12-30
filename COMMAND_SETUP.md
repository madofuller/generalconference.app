# 🚀 General Conference Command - Quick Setup

You now have a powerful command to control your General Conference Analysis app from anywhere!

## ✅ Setup Complete!

The `general-conference` command has been created and added to your shell.

## 🔄 Activate the Command

**For your current terminal session**, run:
```bash
source ~/.zshrc
```

**For all future terminals**, it's already configured! Just open a new terminal.

## 📖 How to Use

### Start Everything (Easiest!)
```bash
general-conference
```
or
```bash
general-conference start
```

This will:
- ✅ Start the Python API Server (port 5001)
- ✅ Start the Next.js App (port 3000)
- ✅ Show you the URLs to access
- ✅ Tell you the servers are ready!

### Check Status
```bash
general-conference status
```

Shows you:
- Which servers are running
- Health check results
- How many talks are loaded

### Stop Everything
```bash
general-conference stop
```

Gracefully stops both servers.

### View Logs
```bash
general-conference logs
```

Shows recent logs from both servers.

### Restart Everything
```bash
general-conference restart
```

Stops and starts both servers (useful after code changes).

### Get Help
```bash
general-conference help
```

## 📍 What You'll See

When you run `general-conference`, you'll see something like:

```
╔════════════════════════════════════════════════════════╗
║     📖 General Conference Analysis Tool 🤖            ║
╚════════════════════════════════════════════════════════╝

🚀 Starting servers...

📊 Starting Python API Server...
   Log: /tmp/gc_api_server.log
   ✅ API Server ready at http://localhost:5001

🌐 Starting Next.js App...
   Log: /tmp/gc_nextjs.log
   ✅ Next.js ready at http://localhost:3000

🎉 All servers are running!

📍 Access the app:
   🌐 Web App:  http://localhost:3000
   🤖 Ask AI:   http://localhost:3000/ask
   📊 API:      http://localhost:5001

📝 Useful commands:
   View logs:     general-conference logs
   Check status:  general-conference status
   Stop servers:  general-conference stop
```

## 🎯 Common Workflows

### Daily Usage
```bash
# Start your work session
general-conference

# Open browser to http://localhost:3000

# When done for the day
general-conference stop
```

### Troubleshooting
```bash
# Check if servers are running
general-conference status

# View recent activity
general-conference logs

# Restart if something's wrong
general-conference restart
```

### Quick Check
```bash
# See what's running
general-conference status
```

## 📂 Log Files

Logs are stored in `/tmp/`:
- **API Server**: `/tmp/gc_api_server.log`
- **Next.js**: `/tmp/gc_nextjs.log`

View them anytime:
```bash
tail -f /tmp/gc_api_server.log
tail -f /tmp/gc_nextjs.log
```

Or use:
```bash
general-conference logs
```

## 🔧 Advanced

### Manual Path (if alias doesn't work)
If the alias doesn't work in some terminals, you can always run:
```bash
/Users/lukejoneslwj/Downloads/conferencescraper/general-conference
```

### Add to Other Shells
If you use bash instead of zsh:
```bash
echo "alias general-conference='/Users/lukejoneslwj/Downloads/conferencescraper/general-conference'" >> ~/.bashrc
source ~/.bashrc
```

### System-Wide Access (Optional)
To make it available system-wide (requires password):
```bash
sudo ln -sf /Users/lukejoneslwj/Downloads/conferencescraper/general-conference /usr/local/bin/general-conference
```

## 🎉 You're All Set!

Now you can start your General Conference Analysis app from anywhere with just:

```bash
general-conference
```

Then visit **http://localhost:3000** and start analyzing! 🚀

---

**Pro Tip**: Open a new terminal and try it now:
```bash
general-conference
```

