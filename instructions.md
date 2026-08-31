# Git Instructions for Invictus Hackathon

**Do not code directly on the `main` branch.**

## General Workflow (For Everyone)

1. **Pull the latest code:** Before you start working, always make sure you have the latest updates from the team.
   ```bash
   git switch main
   git pull origin main
   ```
2. **Switch to your Pod's branch:** Every Pod has its own designated branch to work in.
   ```bash
   git switch <your-pod-branch>
   ```
   *(If the branch doesn't exist yet, create it with: `git switch -c <your-pod-branch>`)*
3. **Write your code and save files.**
4. **Stage and commit your work:**
   ```bash
   git add .
   git commit -m "A short, meaningful message about what you changed"
   ```
5. **Push your changes:**
   ```bash
   git push origin <your-pod-branch>
   ```
   *(If it's your first time pushing this branch, Git will tell you to run `git push --set-upstream origin <your-pod-branch>`)*
6. **Merge to Main:** When your pod finishes a feature, let the team know. We will review it and merge it into `main` together via a Pull Request.

---

## Pod-Specific Instructions

### Pod 1: GenAI & Orchestration
**Members:** Nishtha, Paras, Siddhi
**Branch Name:** `pod1-ai`
**Directory Focus:** `backend/ai/`
**Commands to start working:**
```bash
git switch main
git pull origin main
git switch pod1-ai   # Use `git switch -c pod1-ai` if it's the very first time
```

### Pod 2: Backend Core & Matching
**Members:** Harshika, Nishtha, Paras, Siddhi
**Branch Name:** `pod2-backend`
**Directory Focus:** `backend/api/` and `backend/services/`
**Commands to start working:**
```bash
git switch main
git pull origin main
git switch pod2-backend   # Use `git switch -c pod2-backend` if it's the very first time
```

### Pod 3: DB, ML & RAG
**Members:** Ishita, Amruta
**Branch Name:** `pod3-db`
**Directory Focus:** `backend/database/`
**Commands to start working:**
```bash
git switch main
git pull origin main
git switch pod3-db   # Use `git switch -c pod3-db` if it's the very first time
```

### Pod 4: Frontend UI/UX
**Members:** Nidhi, Sylvester
**Branch Name:** `pod4-frontend`
**Directory Focus:** `frontend/`
**Commands to start working:**
```bash
git switch main
git pull origin main
git switch pod4-frontend   # Use `git switch -c pod4-frontend` if it's the very first time
```

---

## What to do if you encounter a Merge Conflict?
Because each Pod has its own designated directory to work in, conflicts should be rare! But if Git tells you there's a conflict when pulling or merging:
1. Do not force push.
2. Type `git status` to see which files are conflicting.
3. Open the conflicting file in VS Code (it will highlight the conflicts and show "Accept Current Change", "Accept Incoming Change", etc.).
4. Discuss with the person whose code is conflicting with yours if necessary.
5. Save the file, run `git add <file>`, and then `git commit` to resolve it.
