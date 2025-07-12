# AI-Powered Research Assistant with Verifiable Citations

**Live Demo:** [https://research-assistant-tool-461713.web.app/](https://research-assistant-tool-461713.web.app/)

This project is an AI-powered research assistant designed to return **reliable, citation-backed research papers** instead of hallucinated results. It’s ideal for researchers, grant writers, and policy teams who need trustworthy information with proper citations.

---

## 🔍 Why This Tool?

Generative AI often returns confident but incorrect information. This tool solves that by:
- Searching through a **trusted corpus** of academic research.
- Returning results that include **source links and citations**.
- Helping users find the **most relevant papers** with brief explanations of why each paper matters.

---

## 🧠 What It Does

- Accepts a user query or statement.
- Retrieves semantically similar academic papers using vector search.
- Explains the relevance of each paper to the query.
- Provides properly formatted citations (APA/MLA ready).

> ⚠️ **Note**: The current corpus of papers is focused on topics around India, early career professionals, and the role of community. Prompts aligned with these themes yield the most relevant results.

---

## 🔄 Retrieval-Augmented Generation (RAG)

This project is a working example of RAG (Retrieval-Augmented Generation). The current implementation demonstrates a minimal yet powerful pattern that anyone can replicate with their own data and domain-specific use cases.

---

## 🚀 Hosted Version

You can try it live here:  
👉 **[https://research-assistant-tool-461713.web.app/](https://research-assistant-tool-461713.web.app/)**

---

## ⚙️ Tech Stack

| Layer           | Technology / Tool                       |
|------------------|------------------------------------------|
| **Frontend**     | Firebase Hosting (HTML/CSS)             |
| **Backend**      | Firebase Functions (with Genkit)        |
| **AI Models**    | Gemini 1.5 Pro / Flash via Genkit       |
| **Data Layer**   | Cloud SQL (PostgreSQL with pgvector)    |
| **Orchestration**| Firebase Genkit                         |
| **Deployment**   | Firebase + Cloud Run                    |

---

## 📁 Project Structure

```
testkit/
│
├── public/                 # Frontend files
│   ├── index.html
│   └── style.css
│
├── functions/              # Backend code (Genkit + logic)
│   ├── src/
│   │   ├── index.ts
│   │   └── researchAssistant.ts
│   └── lib/
│       ├── db.js
│       ├── generatePoem.js
│       └── researchAssistant.js
│
├── firebase.json           # Firebase config
├── .firebaserc             # Firebase project info
├── .env                    # API keys and secrets (not checked in)
├── package.json            # Root dependencies
└── README.md               # You're reading this!
```

---

## 🛠️ Getting Started Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Anpr1211/research-assistant-ccd-kol-2025.git
cd research-assistant-ccd-kol-2025
```

### 2. Install Dependencies

```bash
npm install
cd functions
npm install
```

### 3. Configure `.env` File

Create a `.env` file in the root directory and include:

```
GEMINI_API_KEY=your-google-ai-key
DATABASE_URL=postgres://username:password@host:port/dbname
```

### 4. Start Development (Genkit)

```bash
npx genkit dev
```

This will run your assistant locally.

---

## 📚 Example Use Case

> **Input:** *“What is the role of community in the careers of Indian freshers?”*

> **Output:**  
> - List of 3–5 academic papers on the topic  
> - Short explanation of each  
> - Direct links + formatted citations

---

## 📦 Deployment

This project is deployed using Firebase:

```bash
firebase deploy
```

Make sure Firebase CLI is authenticated and you’re in the right project.

---

## 📄 License

MIT License — free to use, adapt, and modify.

---

## 🙌 Credits

Built with:
- [Firebase Genkit](https://firebase.google.com/genkit)
- [Google Gemini AI](https://ai.google.dev)
- [Cloud SQL with pgvector](https://cloud.google.com/sql/docs/postgres/pgvector)

---

## 👨‍💻 Maintainers

If you'd like to contribute or extend this assistant for your use case, feel free to fork the repo or raise an issue.
