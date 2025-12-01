# IS 403 INTEX

## 🚀 Getting Started (First-Time Setup)

Follow these steps **in order** to get the Internship Tracker running on your computer.

---

### 🧩 1. Clone the Repository

Open your terminal (VS Code → Terminal → New Terminal), then run:

```bash
git clone https://github.com/michelle-johanson/INTEX_2025.git

cd INTEX_2025
```

✅ You should now be inside the project folder.

Run `pwd` to confirm. If the path ends in `/INTEX_2025`, you’re good!


---
### 📦 2. Install All Dependencies

Run `npm install` to download `node_modules/` and everything required from `package.json`.  

---

### 🔐 3. Set Up Your `.env` File

Create a `.env` file for your environment variables and paste the following inside:

```bash
PORT=3000
SESSION_SECRET=supersecretkey
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=intex
DB_PORT=5432
```

✅ This file stores settings like your port or database info **privately**. The `.gitignore` file ensures that `.env` is never uploaded to GitHub.

---

### ▶️ Run the Server

You can run the server with: `node index.js` or `npm start`

You should see:

```
✅ Server listening on port 3000
```

View the webpage with http://localhost:3000

---

### 🔁 Making Future Changes

Repeat this pattern for every new task:

```bash

git checkout main

git pull origin main

git checkout -b yourname-branch

# Make your edits

git add .

git status
# View your edits

git commit -m "Describe your change"

git push origin yourname-branch

# Create zip file of project

git archive --format=zip --output=(name of zip file).zip HEAD

```


Open a Pull Request:

1. Go to the GitHub repo in your browser.
2. Click **Compare & pull request**.
3. Add a short description (optional)
4. Click **Create pull request.**
This opens a new pull request. In industry, other people would review and merge it, but it's okay if we just merge it ourselves.
5. Click **Merge pull request**

---

### Keep Your Local Copy Updated

Before starting any new work:

```bash
git checkout main
git pull origin main
```

Then create a new branch again for your next task:

```bash
# Check current branch
git branch

# Delete your old branch: (optional)
git branch -d yourname-branch

# Create a new branch
git checkout -b yourname-branch

# Or simply:
git checkout yourname-branch
```

This keeps everyone’s code up-to-date and avoids conflicts.

