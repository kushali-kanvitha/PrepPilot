import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function ATSAnalyzer() {

  // Extract text from PDF
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


  // Technical skills that our ATS analyzer can recognize
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
const skillAliases = {
  "react": ["react", "react.js", "reactjs"],
  "node.js": ["node.js", "nodejs"],
  "rest api": [
  "rest api",
  "rest apis",
  "restful api",
  "restful apis"
],
  "express": ["express", "express.js"],
  "next.js": ["next.js", "nextjs"],
  "oops": ["oops", "oop", "object oriented programming", "object-oriented programming"],
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
    "java script",
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

  // Check whether a skill or any of its aliases exists in text
  const skillMatchesText = (skill, text) => {

    const aliases = skillAliases[skill] || [skill];

    return aliases.some((alias) => {

      const normalizedAlias = alias
        .toLowerCase()
        .trim();

      const normalizedText = text
        .toLowerCase();
     if (normalizedAlias === "c") {
  return /\bc(?:\s+programming)?(?!\+\+|#)\b/i.test(normalizedText);
}
      // For normal words and phrases
      if (
  !normalizedAlias.includes(".") &&
  !normalizedAlias.includes("+") &&
  !normalizedAlias.includes("#") &&
  normalizedAlias !== "c"
)  {
        const regex = new RegExp(
          `\\b${normalizedAlias.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}\\b`,
          "i"
        );

        return regex.test(normalizedText);
      }

      // For skills containing special characters
      // such as C++, C#, Node.js and React.js
      return normalizedText.includes(normalizedAlias);

    });

  };

  // Select resume
  const handleResumeSelect = (e) => {

    const file = e.target.files[0];

    if (file) {
      setResume(file);
    }

  };


  // Analyze resume
  const handleAnalyze = async (e) => {

    e.preventDefault();


    if (!resume) {

      alert("Please select your resume");

      return;

    }


    if (!jobDescription.trim()) {

      alert("Please enter a job description");

      return;

    }


    try {

      // Extract text from resume PDF
      const resumeText = await extractPdfText(resume);

      console.log("Resume text:", resumeText);


      // Convert resume and job description to lowercase
      const resumeTextLower = resumeText.toLowerCase();
      // Check which important resume sections are present
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
const projectQuality =
  resumeTextLower.includes("projects") &&
  resumeTextLower.length > 300;
const resumeLengthQuality = resumeTextLower.length >= 500;
const contactQuality =
  resumeTextLower.includes("@") &&
  /\b\d{10}\b/.test(resumeTextLower);
setResumeSections(detectedSections);


const qualityTotal = 10;

let qualityPassed = 0;

if (detectedSections.contact) qualityPassed += 2;
if (detectedSections.education) qualityPassed += 1;
if (detectedSections.skills) qualityPassed += 2;
if (detectedSections.projects) qualityPassed += 2;
if (detectedSections.experience) qualityPassed += 1;
if (detectedSections.certifications) qualityPassed += 1;

if (resumeLengthQuality) {
  qualityPassed += 1;
}

setResumeQuality({
  passed: Math.min(qualityPassed, qualityTotal),
  total: qualityTotal
});

      const jobTextLower = jobDescription.toLowerCase();
      // Detect required and preferred sections in the job description
const requiredSection = jobTextLower.includes("required skills")
  ? jobTextLower.split("required skills")[1].split("preferred skills")[0]
  : "";

const preferredSection = jobTextLower.includes("preferred skills")
  ? jobTextLower.split("preferred skills")[1].split("education")[0]
  : "";
  const requiredSkills = skills.filter((skill) =>
  skillMatchesText(skill, requiredSection)
);
const preferredSkills = skills.filter((skill) =>
  skillMatchesText(skill, preferredSection)
);


      // Find skills mentioned in the job description
      const jobKeywords = skills.filter((skill) =>
  skillMatchesText(skill, jobTextLower)
);


      // Remove duplicate skills
      const uniqueJobKeywords = [
        ...new Set(jobKeywords)
      ];


      console.log(
        "Skills required by job:",
        uniqueJobKeywords
      );


      // Find skills present in resume
      const matched = uniqueJobKeywords.filter((skill) =>
  skillMatchesText(skill, resumeTextLower)
);

    


      // Find skills missing from resume
      const missing = uniqueJobKeywords.filter((skill) =>
  !skillMatchesText(skill, resumeTextLower)
);


      console.log(
        "Matched skills:",
        matched
      );


      console.log(
        "Missing skills:",
        missing
      );


      // Calculate ATS score
      let calculatedScore = 0;

const requiredMatched = requiredSkills.filter((skill) =>
  matched.includes(skill)
);

const preferredMatched = preferredSkills.filter((skill) =>
  matched.includes(skill)
);
const requiredMissing = requiredSkills.filter(
  (skill) => !matched.includes(skill)
);

const preferredMissing = preferredSkills.filter(
  (skill) => !matched.includes(skill)
);

setRequiredMatchedSkills(requiredMatched);
setRequiredMissingSkills(requiredMissing);

setPreferredMatchedSkills(preferredMatched);
setPreferredMissingSkills(preferredMissing);
const requiredPoints = requiredSkills.length * 2;
const preferredPoints = preferredSkills.length;

const earnedPoints =
  (requiredMatched.length * 2) +
  preferredMatched.length;

const totalPoints =
  requiredPoints +
  preferredPoints;

// Skill matching score
let skillScore = 0;

if (totalPoints > 0) {
  skillScore = Math.round(
    (earnedPoints / totalPoints) * 100
  );
}

// Resume quality score
// Resume quality score
const qualityScore = Math.round(
  (qualityPassed / qualityTotal) * 100
);

// Final ATS score
calculatedScore = Math.round(
  (skillScore * 0.7) +
  (qualityScore * 0.3)
);

// Final ATS score
calculatedScore = Math.round(
  (skillScore * 0.7) +
  (qualityScore * 0.3)
);


      // Store results
      setScore(calculatedScore);

setScoreBreakdown({
  requiredMatched: requiredMatched.length,
  requiredTotal: requiredSkills.length,
  preferredMatched: preferredMatched.length,
  preferredTotal: preferredSkills.length
});

setMatchedKeywords(matched);
setMissingKeywords(missing);

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


  return (

    <div>

      <h1>ATS Resume Analyzer</h1>

      <p>
        Check how well your resume matches a job description.
      </p>


      <form onSubmit={handleAnalyze}>

        <h3>Select Resume</h3>

        <input
          type="file"
          accept=".pdf"
          onChange={handleResumeSelect}
          required
        />


        <h3>Job Description</h3>

        <textarea

          placeholder="Paste the job description here..."

          value={jobDescription}

          onChange={(e) =>
            setJobDescription(e.target.value)
          }

          rows="10"

          cols="50"

          required

        />


        <br />
        <br />


        <button type="submit">

          Analyze Resume

        </button>

      </form>


      {/* Selected Resume */}

      {resume && (

        <div>

          <hr />

          <h3>Selected Resume</h3>

          <p>
            File: {resume.name}
          </p>

          <p>
            Size: {(resume.size / 1024).toFixed(2)} KB
          </p>

        </div>

      )}


      {/* ATS Results */}

      {score !== null && (

        <div>

          <hr />


          <h2>
            ATS Score: {score}/100
          </h2>
          <h3>📊 Score Breakdown</h3>

<ul>
  <li>
    Required Skills: {scoreBreakdown.requiredMatched} /{" "}
    {scoreBreakdown.requiredTotal} matched
  </li>

  <li>
    Preferred Skills: {scoreBreakdown.preferredMatched} /{" "}
    {scoreBreakdown.preferredTotal} matched
  </li>
</ul>
<h3>📝 Resume Quality</h3>

<p>
  Quality Score: {resumeQuality.passed} /{" "}
  {resumeQuality.total}
</p>
          <h3>
  📄 Resume Sections
</h3>

<ul>

  <li>
    Contact: {resumeSections.contact ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Education: {resumeSections.education ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Skills: {resumeSections.skills ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Projects: {resumeSections.projects ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Certifications: {resumeSections.certifications ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Experience: {resumeSections.experience ? "✅ Present" : "❌ Missing"}
  </li>

  <li>
    Summary / Objective: {resumeSections.summary ? "✅ Present" : "❌ Missing"}
  </li>

</ul>

         {/* Resume ↔ Job Description */}

<h3>
  🔍 Resume ↔ Job Description
</h3>

<h4>✅ Required Skills — Matched</h4>

{requiredMatchedSkills.length === 0 ? (
  <p>No required skills matched.</p>
) : (
  <ul>
    {requiredMatchedSkills.map((skill) => (
      <li key={skill}>{skill}</li>
    ))}
  </ul>
)}

<h4>❌ Required Skills — Missing</h4>

{requiredMissingSkills.length === 0 ? (
  <p>No required skills are missing.</p>
) : (
  <ul>
    {requiredMissingSkills.map((skill) => (
      <li key={skill}>{skill}</li>
    ))}
  </ul>
)}

<h4>✅ Preferred Skills — Matched</h4>

{preferredMatchedSkills.length === 0 ? (
  <p>No preferred skills matched.</p>
) : (
  <ul>
    {preferredMatchedSkills.map((skill) => (
      <li key={skill}>{skill}</li>
    ))}
  </ul>
)}

<h4>❌ Preferred Skills — Missing</h4>

{preferredMissingSkills.length === 0 ? (
  <p>No preferred skills are missing.</p>
) : (
  <ul>
    {preferredMissingSkills.map((skill) => (
      <li key={skill}>{skill}</li>
    ))}
  </ul>
)}

          {/* Suggestions */}

<h3>💡 Suggestions</h3>

{requiredMissingSkills.length + preferredMissingSkills.length > 0 ? (

  <ul>

    {requiredMissingSkills.map((skill) => (
      <li key={`required-${skill}`}>
        <strong>{skill}</strong> is required by the job description but was
        not detected in your resume. Add it only if you genuinely have
        experience with it.
      </li>
    ))}

    {preferredMissingSkills.map((skill) => (
      <li key={`preferred-${skill}`}>
        <strong>{skill}</strong> is preferred by the job description but was
        not detected in your resume. Add it only if you genuinely have
        experience with it.
      </li>
    ))}

    <li>
      Mention projects or experience that demonstrate your relevant skills.
    </li>

    <li>
      Keep important technical skills clearly visible in your resume.
    </li>

  </ul>

) : (

  <p>
    Your resume contains all the required and preferred skills detected
    from this job description.
  </p>

)}
        </div>

      )}

    </div>

  );

}


export default ATSAnalyzer;