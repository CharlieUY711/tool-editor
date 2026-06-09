# ToolEditor — Comandos Git + Vercel
# Repo:  https://github.com/CharlieUY711/tool-editor
# Local: C:\Core\tools\tool-editor

# ══════════════════════════════════════════════════════
# PRIMERA VEZ — Crear proyecto, repo y subir
# ══════════════════════════════════════════════════════

cd C:\Core\tools\tool-editor

# 1. Instalar dependencias
npm install

# 2. Verificar que compila
npm run build

# 3. Inicializar git
git init
git add .
git commit -m "feat: ToolEditor v1.1 - initial commit"

# 4A. Con GitHub CLI (recomendado)
gh auth login
gh repo create CharlieUY711/tool-editor --public --source=. --remote=origin --push

# 4B. Sin GitHub CLI
#     Crear repo en https://github.com/new
#     Nombre: tool-editor  |  Public  |  Sin README ni .gitignore
git remote add origin https://github.com/CharlieUY711/tool-editor.git
git branch -M main
git push -u origin main


# ══════════════════════════════════════════════════════
# ACTUALIZAR — Después de cada cambio
# ══════════════════════════════════════════════════════

cd C:\Core\tools\tool-editor

git add .
git commit -m "feat: descripción del cambio"
git push

# Vercel redeploya automáticamente. Sin comandos extra.


# ══════════════════════════════════════════════════════
# CLONAR en otra máquina
# ══════════════════════════════════════════════════════

git clone https://github.com/CharlieUY711/tool-editor.git
cd tool-editor
npm install
npm run dev


# ══════════════════════════════════════════════════════
# DEPLOY EN VERCEL — Primera vez
# ══════════════════════════════════════════════════════

# Opción A: browser (más fácil)
# 1. https://vercel.com/new
# 2. Import → CharlieUY711/tool-editor
# 3. Framework: Vite  (autodetectado)
# 4. Click "Deploy"
# → URL: https://tool-editor.vercel.app

# Opción B: terminal
npm install -g vercel
vercel login
vercel --prod


# ══════════════════════════════════════════════════════
# SINCRONIZAR con remoto
# ══════════════════════════════════════════════════════

git pull origin main


# ══════════════════════════════════════════════════════
# ESTRUCTURA DEL PROYECTO
# ══════════════════════════════════════════════════════

# C:\Core\tools\tool-editor\
# ├── index.html
# ├── vite.config.js
# ├── vercel.json
# ├── package.json
# ├── .gitignore
# ├── COMMANDS.md
# └── src\
#     ├── main.jsx
#     └── components\
#         ├── ToolEditor.jsx              ← componente principal
#         └── effects\
#             └── effectsEngine.js        ← motor de efectos (blur, pixelado, marcas de agua)
