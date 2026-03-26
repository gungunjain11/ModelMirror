# ModelMirror

A comprehensive AI-powered development platform combining a web-based IDE and Chrome extension for intelligent code analysis, explanation, and refactoring.

## 📁 Project Structure

This is a **monorepo** containing two main projects:

### 1. **ModelMirror IDE** (Root)
A web-based IDE built with **React + TypeScript + Vite** featuring AI-powered code analysis and suggestions.

```
├── src/
│   ├── components/          # React components
│   │   ├── mm/              # Main IDE components
│   │   │   ├── tabs/        # Feature tabs (Explain, Refactor, Tests, Chat)
│   │   │   ├── views/       # Analytics, Diff, Settings views
│   │   │   └── ...
│   │   └── ui/              # Shadcn UI components
│   ├── contexts/            # React context (AppContext)
│   ├── lib/                 # Utilities & helpers
│   ├── config/              # API configuration
│   └── pages/               # Page components
├── package.json             # IDE dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript config
```

**Features:**
- 💡 **Explain:** AI-powered code explanation with complexity analysis
- 🧪 **Tests:** Automatic test case generation and validation
- 🔄 **Refactor:** Code refactoring suggestions (Simplify, Performance, Readability)
- 💬 **Chat:** Interactive coding mentor for guidance
- 📊 **Analytics:** Code activity tracking and heatmaps
- 🎨 **Theme Support:** Dark/Light mode toggle

### 2. **Model Mirror Chrome Extension** (`/chrome-extension`)
A Chrome extension that brings ModelMirror's AI features directly to your browser.

```
chrome-extension/
├── manifest.json            # Extension configuration
├── background.js            # Service worker
├── content.js               # Content script
├── sidepanel.html/js        # Side panel UI
├── server.js                # Local server
├── package.json             # Extension dependencies
└── icons/                   # Extension icons
```

**Features:**
- 🔌 Seamless browser integration
- ⚡ Real-time code assistance
- 🎯 Context-aware suggestions

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ / npm or yarn
- Chrome browser (for extension)
- OpenRouter API key (for AI features)

### IDE Setup

1. **Install dependencies:**
   ```bash
   cd ModelMirror
   npm install
   ```

2. **Configure API:**
   Create a `.env` file:
   ```env
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080)

### Chrome Extension Setup

1. **Install dependencies:**
   ```bash
   cd chrome-extension
   npm install
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

---

## 🛠️ Tech Stack

### IDE
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui (Radix UI)
- **API:** OpenRouter (GPT-4o-mini)
- **State Management:** React Context

### Chrome Extension
- **Manifest V3**
- **JavaScript/HTML/CSS**
- **Chrome APIs**

---

## 📦 Key Dependencies

### IDE
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "@radix-ui/*": "latest",
  "lucide-react": "^0.x"
}
```

---

## 🎯 Available Scripts

### IDE
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Watch mode testing
```

### Chrome Extension
```bash
cd chrome-extension
npm install          # Install dependencies
npm start            # Start local server (if applicable)
```

---

## 🔑 API Configuration

ModelMirror uses **OpenRouter API** for AI features:

1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Add to `.env` file:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
   ```
3. Rate limiting: 200ms between requests (automatic)

---

## 📋 Features Overview

### Explain Tab
- Analyzes code complexity
- Detects security/performance issues
- Provides clear explanations
- Shows issue severity levels

### Tests Tab
- Generates edge test cases
- Validates existing tests
- Identifies weak test coverage
- Suggests missing edge cases

### Refactor Tab
- Three refactoring modes: Simplify, Performance, Readability
- Specific, actionable suggestions
- Code quality improvements

### Chat Tab
- Interactive coding mentor
- Hints without full solutions
- Real-time streaming responses
- Guidance for learning

### Analytics View
- Activity heatmaps
- Line edit frequency
- Session metrics
- Performance insights

---

## 🛡️ Security Notes

- ⚠️ Never commit `.env` files with real API keys
- Use environment variables for sensitive data
- API requests include rate limiting
- Server-side validation recommended for production

---

## 📝 Development Guidelines

1. **Code Structure:** Follow React best practices
2. **Components:** Use functional components with hooks
3. **Styling:** Use Tailwind classes, avoid inline styles
4. **Types:** Maintain strict TypeScript typing
5. **Testing:** Write tests for new features
6. **Git:** Use meaningful commit messages

---

## 🤝 Contributing

Contributions welcome! Please:
1. Create a branch for your feature
2. Make focused commits
3. Submit a pull request
4. Ensure tests pass

---



## 👤 Author

**Gungun Jain**, **Krati Mishra**, **Sanaya**
- GitHub: [@gungunjain11](https://github.com/gungunjain11), [@KratiMishra21](https://github.com/KratiMishra21), [@Sanaya27](https://github.com/Sanaya27)
- 
- Repository: [ModelMirror](https://github.com/gungunjain11/ModelMirror)


---

## 📮 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments

---

