const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const compileRun = require("compile-run");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit JSON payload to prevent abuse
app.use(cors());

// Language Configuration
const languagesDic = {
  python: {
    runner: compileRun.python,
    language: "python3",
  },
  javascript: {
    runner: compileRun.javascript,
    language: "javascript",
  },
  java: {
    runner: compileRun.java,
    language: "java",
  },
  c: {
    runner: compileRun.c,
    language: "c",
  },
  cpp: {
    runner: compileRun.cpp,
    language: "cpp",
  },
  swift: {
    runner: compileRun.swift,
    language: "swift",
  },
  kotlin: {
    runner: compileRun.kotlin,
    language: "kotlin",
  },
  bash: {
    runner: compileRun.bash,
    language: "bash",
  },
  typescript: {
    runner: compileRun.typescript,
    language: "typescript",
  },
  groovy: {
    runner: compileRun.groovy,
    language: "groovy",
  },
  html: {
    runner: null,
    language: "html",
  },
};

function handleError(error) {
  console.error("Error:", error);
  if (error.stderr) {
    return { error: error.stderr };
  }
  if (error.message) {
    return { error: error.message };
  }
  return { error: "Internal server error" };
}

app.post("/", async (req, res) => {
  const { content: code, language, stdin } = req.body;

  if (!code || !language) {
    return res
      .status(400)
      .json({ error: "Missing required fields: code and language." });
  }

  const langKey = language.toLowerCase();
  const langConfig = languagesDic[langKey];

  if (!langConfig) {
    return res.status(400).json({ error: "Unsupported language." });
  }

  if (langKey === "html") {
    return res.status(200).json({
      stdout: "HTML content received.",
      stderr: "",
      html: code, 
    });
  }

  if (!langConfig.runner) {
    return res.status(400).json({ error: "Execution not supported for this language." });
  }

  try {
    const executionId = uuidv4();

    const runOptions = {
      stdin: stdin || "",
      timeout: 5000, 
    };

    const result = await langConfig.runner.runSource(code, runOptions);

    if (result.stderr) {
      return res.status(400).json({
        error: "Compilation/Runtime Error",
        details: result.stderr,
      });
    }

    res.status(200).json({
      stdout: result.stdout,
      stderr: result.stderr || "",
    });
  } catch (error) {
    const detailedError = handleError(error);
    res.status(500).json(detailedError);
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Service is healthy." });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});