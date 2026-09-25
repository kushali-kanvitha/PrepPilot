import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./ATSAnalyzer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function ATSAnalyzer() {

  // =========================
  // EXTRACT TEXT FROM PDF
  // =========================

  const extractPdfText = async (file) => {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer
    }).promise;

    let fullText = "";

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {

      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");

      fullText += pageText + " ";
    }

    return fullText;
  };


  // =========================
  // STATES
  // =========================

  const [resume, setResume] = useState(null);

  const [jobDescription, setJobDescription] = useState("");

  const [score, setScore] = useState(null);

  const [missingKeywords, setMissingKeywords] = useState([]);

  const [matchedKeywords, setMatchedKeywords] = useState([]);

  const [requiredMatchedSkills, setRequiredMatchedSkills] = useState([]);

  const [requiredMissingSkills, setRequiredMissingSkills] = useState([]);

  const [preferredMatchedSkills, setPreferredMatchedSkills] = useState([]);

  const [preferredMissingSkills, setPreferredMissingSkills] = useState([]);

  const [resumeSections, setResumeSections] = useState({
    contact: false,
    education: false,
    skills: false,
    projects: false,
    certifications: false,
    experience: false,
    summary: false
  });

  const [scoreBreakdown, setScoreBreakdown] = useState({
    requiredMatched: 0,
    requiredTotal: 0,
    preferredMatched: 0,
    preferredTotal: 0
  });

  const [resumeQuality, setResumeQuality] = useState({
    passed: 0,
    total: 10
  });


  // =========================
  // ATS SKILLS
  // =========================

  const skills = [

    // Programming Languages
    "java",
    "python",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "c",

    // Frontend / Web Development
    "html",
    "css",
    "react",
    "angular",
    "vue",
    "next.js",
    "frontend",
    "front-end",
    "web development",
    "responsive design",
    "responsive web design",
    "ui development",
    "user interface",
    "ui/ux",

    // Backend
    "node.js",
    "express",
    "spring",
    "spring boot",
    "rest api",
    "restful api",
    "microservices",

    // Databases
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "firebase",
    "database",
    "dbms",

    // Computer Science
    "data structures",
    "algorithms",
    "dsa",
    "oops",
    "operating systems",
    "computer networks",

    // Tools
    "git",
    "github",
    "docker",
    "kubernetes",
    "linux",
    "vs code",

    // Cloud
    "aws",
    "azure",
    "google cloud",
    "gcp",

    // Data / AI
    "machine learning",
    "artificial intelligence",
    "data science",
    "data analysis",
    "statistics",
    "data visualization",
    "power bi",
    "tableau",
    "analytical skills",
    "pandas",
    "numpy",
    "deep learning",
    "natural language processing",

    // Python Libraries
    "matplotlib",
    "scikit-learn",

    // Big Data
    "hadoop",
    "spark",
    "kafka",

    // Soft Skills
    "problem solving",
    "communication",
    "teamwork",
    "leadership"

  ];


  // =========================
  // SKILL ALIASES
  // =========================

  const skillAliases = {

    "react": [
      "react",
      "react.js",
      "reactjs"
    ],

    "node.js": [
      "node.js",
      "nodejs"
    ],

    "rest api": [
      "rest api",
      "rest apis",
      "restful api",
      "restful apis"
    ],

    "express": [
      "express",
      "express.js"
    ],

    "next.js": [
      "next.js",
      "nextjs"
    ],

    "oops": [
      "oops",
      "oop",
      "object oriented programming",
      "object-oriented programming"
    ],

    "data structures": [
      "data structures",
      "data structure"
    ],

    "algorithms": [
      "algorithms",
      "algorithm"
    ],

    "dsa": [
      "dsa",
      "data structures and algorithms"
    ],

    "javascript": [
      "javascript",
      "java script"
    ],

    "html": [
      "html",
      "html5"
    ],

    "css": [
      "css",
      "css3"
    ]

  };


  // =========================
  // CHECK SKILL IN TEXT
  // =========================

  const skillMatchesText = (skill, text) => {

    const aliases = skillAliases[skill] || [skill];

    return aliases.some((alias) => {

      const normalizedAlias =
        alias.toLowerCase().trim();

      const normalizedText =
        text.toLowerCase();


      // Special case for C
      if (normalizedAlias === "c") {

        return /\bc(?:\s+programming)?(?!\+\+|#)\b/i.test(
          normalizedText
        );

      }


      // Normal words and phrases
      if (
        !normalizedAlias.includes(".") &&
        !normalizedAlias.includes("+") &&
        !normalizedAlias.includes("#") &&
        normalizedAlias !== "c"
      ) {

        const regex = new RegExp(
          `\\b${normalizedAlias.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\b`,
          "i"
        );

        return regex.test(normalizedText);

      }


      // Skills containing special characters
      // such as C++, C#, Node.js and React.js

      return normalizedText.includes(
        normalizedAlias
      );

    });

  };


  // =========================
  // SELECT RESUME
  // =========================

  const handleResumeSelect = (e) => {

    const file = e.target.files[0];

    if (file) {

      setResume(file);

    }

  };


  // =========================
  // ANALYZE RESUME
  // =========================

  const handleAnalyze = async (e) => {

    e.preventDefault();


    // Check resume
    if (!resume) {

      alert("Please select your resume");

      return;

    }


    // Check job description
    if (!jobDescription.trim()) {

      alert("Please enter a job description");

      return;

    }


    try {

      // =========================
      // EXTRACT RESUME TEXT
      // =========================

      const resumeText =
        await extractPdfText(resume);

      console.log(
        "Resume text:",
        resumeText
      );


      // Convert resume to lowercase
      const resumeTextLower =
        resumeText.toLowerCase();


      // =========================
      // DETECT RESUME SECTIONS
      // =========================

      const detectedSections = {

        contact:
          resumeTextLower.includes("email") ||
          resumeTextLower.includes("phone") ||
          resumeTextLower.includes("linkedin"),

        education:
          resumeTextLower.includes("education") ||
          resumeTextLower.includes("b.tech") ||
          resumeTextLower.includes("bachelor"),

        skills:
          resumeTextLower.includes("skills") ||
          resumeTextLower.includes("technical skills"),

        projects:
          resumeTextLower.includes("projects") ||
          resumeTextLower.includes("project"),

        certifications:
          resumeTextLower.includes("certifications") ||
          resumeTextLower.includes("certification"),

        experience:
          resumeTextLower.includes("experience") ||
          resumeTextLower.includes("internship"),

        summary:
          resumeTextLower.includes("summary") ||
          resumeTextLower.includes("objective")

      };


      // =========================
      // RESUME QUALITY
      // =========================

      const projectQuality =
        resumeTextLower.includes("projects") &&
        resumeTextLower.length > 300;

      const resumeLengthQuality =
        resumeTextLower.length >= 500;

      const contactQuality =
        resumeTextLower.includes("@") &&
        /\b\d{10}\b/.test(resumeTextLower);


      setResumeSections(
        detectedSections
      );


      const qualityTotal = 10;

      let qualityPassed = 0;


      if (detectedSections.contact)
        qualityPassed += 2;

      if (detectedSections.education)
        qualityPassed += 1;

      if (detectedSections.skills)
        qualityPassed += 2;

      if (detectedSections.projects)
        qualityPassed += 2;

      if (detectedSections.experience)
        qualityPassed += 1;

      if (detectedSections.certifications)
        qualityPassed += 1;

      if (resumeLengthQuality)
        qualityPassed += 1;


      setResumeQuality({

        passed:
          Math.min(
            qualityPassed,
            qualityTotal
          ),

        total:
          qualityTotal

      });


      // =========================
      // JOB DESCRIPTION
      // =========================

      const jobTextLower =
        jobDescription.toLowerCase();


      // =========================
      // REQUIRED / PREFERRED
      // =========================

      const requiredSection =
        jobTextLower.includes("required skills")
          ? jobTextLower
              .split("required skills")[1]
              .split("preferred skills")[0]
          : "";


      const preferredSection =
        jobTextLower.includes("preferred skills")
          ? jobTextLower
              .split("preferred skills")[1]
              .split("education")[0]
          : "";


      // Find required skills

      const requiredSkills =
        skills.filter((skill) =>
          skillMatchesText(
            skill,
            requiredSection
          )
        );


      // Find preferred skills

      const preferredSkills =
        skills.filter((skill) =>
          skillMatchesText(
            skill,
            preferredSection
          )
        );


      // =========================
      // FIND ALL JOB KEYWORDS
      // =========================

      const jobKeywords =
        skills.filter((skill) =>
          skillMatchesText(
            skill,
            jobTextLower
          )
        );


      // Remove duplicates

      const uniqueJobKeywords = [
        ...new Set(jobKeywords)
      ];


      console.log(
        "Skills required by job:",
        uniqueJobKeywords
      );


      // =========================
      // MATCHED SKILLS
      // =========================

      const matched =
        uniqueJobKeywords.filter((skill) =>
          skillMatchesText(
            skill,
            resumeTextLower
          )
        );


      // =========================
      // MISSING SKILLS
      // =========================

      const missing =
        uniqueJobKeywords.filter((skill) =>
          !skillMatchesText(
            skill,
            resumeTextLower
          )
        );


      console.log(
        "Matched skills:",
        matched
      );

      console.log(
        "Missing skills:",
        missing
      );


      // =========================
      // REQUIRED / PREFERRED MATCH
      // =========================

      const requiredMatched =
        requiredSkills.filter((skill) =>
          matched.includes(skill)
        );


      const preferredMatched =
        preferredSkills.filter((skill) =>
          matched.includes(skill)
        );


      const requiredMissing =
        requiredSkills.filter(
          (skill) =>
            !matched.includes(skill)
        );


      const preferredMissing =
        preferredSkills.filter(
          (skill) =>
            !matched.includes(skill)
        );


      setRequiredMatchedSkills(
        requiredMatched
      );

      setRequiredMissingSkills(
        requiredMissing
      );

      setPreferredMatchedSkills(
        preferredMatched
      );

      setPreferredMissingSkills(
        preferredMissing
      );


      // =========================
      // ATS SCORE
      // =========================

      const requiredPoints =
        requiredSkills.length * 2;

      const preferredPoints =
        preferredSkills.length;


      const earnedPoints =
        (requiredMatched.length * 2) +
        preferredMatched.length;


      const totalPoints =
        requiredPoints +
        preferredPoints;


      // Skill matching score

      let skillScore = 0;

      if (totalPoints > 0) {

        skillScore =
          Math.round(
            (earnedPoints / totalPoints) *
            100
          );

      }


      // Resume quality score

      const qualityScore =
        Math.round(
          (qualityPassed / qualityTotal) *
          100
        );


      // Final ATS score

      const calculatedScore =
        Math.round(
          (skillScore * 0.7) +
          (qualityScore * 0.3)
        );


      // =========================
      // STORE RESULTS
      // =========================

      setScore(
        calculatedScore
      );


      setScoreBreakdown({

        requiredMatched:
          requiredMatched.length,

        requiredTotal:
          requiredSkills.length,

        preferredMatched:
          preferredMatched.length,

        preferredTotal:
          preferredSkills.length

      });


      setMatchedKeywords(
        matched
      );

      setMissingKeywords(
        missing
      );


    } catch (error) {

      console.log(
        "PDF reading error:",
        error
      );

      alert(
        "Unable to read this PDF. Please make sure it is a text-based PDF."
      );

    }

  };


  // =========================
  // UI
  // =========================

  return (

    <div className="ats-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="ats-header">

        <h1>
          ATS Resume Analyzer
        </h1>

        <p>
          Check how well your resume matches a job description.
        </p>

      </div>


      {/* =========================
          MAIN CONTAINER
      ========================= */}

      <div className="ats-container">


        {/* =========================
            ANALYZER FORM
        ========================= */}

        <div className="ats-card">

          <form
            className="ats-form"
            onSubmit={handleAnalyze}
          >

            {/* Resume */}

            <div className="ats-form-group">

              <label>
                Select Resume
              </label>

              <input
                className="ats-file-input"
                type="file"
                accept=".pdf"
                onChange={handleResumeSelect}
                required
              />

            </div>


            {/* Job Description */}

            <div className="ats-form-group">

              <label>
                Job Description
              </label>

              <textarea
                className="ats-textarea"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                rows="10"
                required
              />

            </div>


            {/* Analyze */}

            <button
              className="ats-analyze-btn"
              type="submit"
            >
              Analyze Resume
            </button>

          </form>

        </div>


        {/* =========================
            SELECTED RESUME
        ========================= */}

        {resume && (

          <div className="ats-card">

            <h2>
              Selected Resume
            </h2>

            <div className="ats-file-info">

              <p>
                File: {resume.name}
              </p>

              <p>
                Size: {(resume.size / 1024).toFixed(2)} KB
              </p>

            </div>

          </div>

        )}


        {/* =========================
            ATS RESULTS
        ========================= */}

        {score !== null && (

          <div className="ats-card">


            {/* SCORE */}

            <div className="ats-score">

              <h2>
                ATS Score: {score}/100
              </h2>

            </div>


            {/* =========================
                SCORE BREAKDOWN
            ========================= */}

            <div className="ats-result-section">

              <h3>
                📊 Score Breakdown
              </h3>

              <ul>

                <li>
                  Required Skills:{" "}
                  {scoreBreakdown.requiredMatched}
                  {" / "}
                  {scoreBreakdown.requiredTotal}
                  {" "}matched
                </li>

                <li>
                  Preferred Skills:{" "}
                  {scoreBreakdown.preferredMatched}
                  {" / "}
                  {scoreBreakdown.preferredTotal}
                  {" "}matched
                </li>

              </ul>

            </div>


            {/* =========================
                RESUME QUALITY
            ========================= */}

            <div className="ats-result-section">

              <h3>
                📝 Resume Quality
              </h3>

              <p>
                Quality Score:{" "}
                {resumeQuality.passed}
                {" / "}
                {resumeQuality.total}
              </p>

            </div>


            {/* =========================
                RESUME SECTIONS
            ========================= */}

            <div className="ats-result-section">

              <h3>
                📄 Resume Sections
              </h3>

              <ul>

                <li>
                  Contact:{" "}
                  {resumeSections.contact
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Education:{" "}
                  {resumeSections.education
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Skills:{" "}
                  {resumeSections.skills
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Projects:{" "}
                  {resumeSections.projects
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Certifications:{" "}
                  {resumeSections.certifications
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Experience:{" "}
                  {resumeSections.experience
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

                <li>
                  Summary / Objective:{" "}
                  {resumeSections.summary
                    ? "✅ Present"
                    : "❌ Missing"}
                </li>

              </ul>

            </div>


            {/* =========================
                RESUME ↔ JOB DESCRIPTION
            ========================= */}

            <div className="ats-result-section">

              <h3>
                🔍 Resume ↔ Job Description
              </h3>


              {/* Required Matched */}

              <div className="ats-matched">

                <h4>
                  ✅ Required Skills — Matched
                </h4>

                {requiredMatchedSkills.length === 0 ? (

                  <p>
                    No required skills matched.
                  </p>

                ) : (

                  <ul>

                    {requiredMatchedSkills.map(
                      (skill) => (

                        <li key={skill}>
                          {skill}
                        </li>

                      )
                    )}

                  </ul>

                )}

              </div>


              {/* Required Missing */}

              <div className="ats-missing">

                <h4>
                  ❌ Required Skills — Missing
                </h4>

                {requiredMissingSkills.length === 0 ? (

                  <p>
                    No required skills are missing.
                  </p>

                ) : (

                  <ul>

                    {requiredMissingSkills.map(
                      (skill) => (

                        <li key={skill}>
                          {skill}
                        </li>

                      )
                    )}

                  </ul>

                )}

              </div>


              {/* Preferred Matched */}

              <div className="ats-preferred">

                <h4>
                  ✅ Preferred Skills — Matched
                </h4>

                {preferredMatchedSkills.length === 0 ? (

                  <p>
                    No preferred skills matched.
                  </p>

                ) : (

                  <ul>

                    {preferredMatchedSkills.map(
                      (skill) => (

                        <li key={skill}>
                          {skill}
                        </li>

                      )
                    )}

                  </ul>

                )}

              </div>


              {/* Preferred Missing */}

              <div className="ats-missing">

                <h4>
                  ❌ Preferred Skills — Missing
                </h4>

                {preferredMissingSkills.length === 0 ? (

                  <p>
                    No preferred skills are missing.
                  </p>

                ) : (

                  <ul>

                    {preferredMissingSkills.map(
                      (skill) => (

                        <li key={skill}>
                          {skill}
                        </li>

                      )
                    )}

                  </ul>

                )}

              </div>

            </div>


            {/* =========================
                SUGGESTIONS
            ========================= */}

            <div className="ats-result-section ats-suggestions">

              <h3>
                💡 Suggestions
              </h3>

              {requiredMissingSkills.length +
                preferredMissingSkills.length > 0 ? (

                <ul>

                  {requiredMissingSkills.map(
                    (skill) => (

                      <li
                        key={`required-${skill}`}
                      >

                        <strong>
                          {skill}
                        </strong>{" "}
                        is required by the job description
                        but was not detected in your resume.
                        Add it only if you genuinely have
                        experience with it.

                      </li>

                    )
                  )}


                  {preferredMissingSkills.map(
                    (skill) => (

                      <li
                        key={`preferred-${skill}`}
                      >

                        <strong>
                          {skill}
                        </strong>{" "}
                        is preferred by the job description
                        but was not detected in your resume.
                        Add it only if you genuinely have
                        experience with it.

                      </li>

                    )
                  )}


                  <li>
                    Mention projects or experience that
                    demonstrate your relevant skills.
                  </li>

                  <li>
                    Keep important technical skills clearly
                    visible in your resume.
                  </li>

                </ul>

              ) : (

                <p>
                  Your resume contains all the required
                  and preferred skills detected from this
                  job description.
                </p>

              )}

            </div>


          </div>

        )}

      </div>

    </div>

  );

}

export default ATSAnalyzer;