import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import "./InterviewPrep.css";

function InterviewPrep() {

  // --------------------------------------------------
  // DEFAULT QUESTIONS
  // --------------------------------------------------

  const defaultHRQuestions = [
    "Tell me about yourself.",
    "What are your strengths?",
    "What are your weaknesses?",
    "Why should we hire you?",
    "Why do you want to join our company?",
    "Where do you see yourself in 5 years?",
    "Tell me about a challenge you faced and how you handled it.",
    "Why did you choose Computer Science?",
    "Are you comfortable working in a team?",
    "How do you handle pressure?",
    "Why do you want to work for our company?",
    "Tell me about a project you worked on.",
    "What is your biggest achievement?",
    "Tell me about a failure and what you learned from it.",
    "How do you handle criticism?",
    "How do you prioritize your work?",
    "Are you willing to relocate?",
    "What motivates you?",
    "Why should we select you over other candidates?",
    "Do you have any questions for us?"
  ];


  const defaultTechnicalQuestions = [
    "What are the four pillars of OOP?",
    "What is the difference between an array and a linked list?",
    "What is a stack and where is it used?",
    "What is a queue?",
    "What is the difference between BFS and DFS?",
    "What is a primary key in DBMS?",
    "What is a foreign key?",
    "What is normalization in DBMS?",
    "What is the difference between DELETE, DROP and TRUNCATE?",
    "What is the difference between TCP and UDP?",
    "What is an operating system?",
    "What is the difference between a process and a thread?",
    "What is time complexity?",
    "What is the difference between Java and C++?",
    "What is React?"
  ];


  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [activeCategory, setActiveCategory] =
    useState("HR");

  const [questions, setQuestions] =
    useState([]);

  const [selectedQuestion, setSelectedQuestion] =
    useState(null);

  const [answer, setAnswer] =
    useState("");

  const [company, setCompany] =
    useState("");

  const [round, setRound] =
    useState("HR");

  const [questionText, setQuestionText] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [showAddQuestion, setShowAddQuestion] =
    useState(false);


  // --------------------------------------------------
  // LOAD QUESTIONS FROM FIRESTORE
  // --------------------------------------------------

  useEffect(() => {

    let unsubscribeQuestions;

    const unsubscribeAuth =
      onAuthStateChanged(auth, (user) => {

        if (!user) {
          setQuestions([]);
          return;
        }

        const q = query(
          collection(db, "interviewAnswers"),
          where("userId", "==", user.uid)
        );

        unsubscribeQuestions = onSnapshot(
          q,
          (snapshot) => {

            const questionList =
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
              }));

            setQuestions(questionList);
          },

          (error) => {

            console.log(
              "Error getting interview questions:",
              error
            );

          }
        );

      });


    return () => {

      unsubscribeAuth();

      if (unsubscribeQuestions) {
        unsubscribeQuestions();
      }

    };

  }, []);


  // --------------------------------------------------
  // CREATE DISPLAY LIST
  // --------------------------------------------------

  const firestoreQuestions =
    questions.filter(
      (item) =>
        item.category === activeCategory
    );


  const firestoreQuestionTexts =
    firestoreQuestions.map(
      (item) => item.question
    );


  const defaultQuestions =
    activeCategory === "HR"
      ? defaultHRQuestions
      : defaultTechnicalQuestions;


  const defaultQuestionObjects =
    defaultQuestions
      .filter(
        (question) =>
          !firestoreQuestionTexts.includes(question)
      )
      .map((question) => ({
        id: null,
        question: question,
        category: activeCategory,
        company: "",
        round: activeCategory,
        answer: "",
        isDefault: true
      }));


  const displayedQuestions = [
    ...firestoreQuestions,
    ...defaultQuestionObjects
  ];


  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  const answeredCount =
    firestoreQuestions.filter(
      (item) =>
        item.answer &&
        item.answer.trim() !== ""
    ).length;


  const totalQuestions =
    displayedQuestions.length;


  const progress =
    totalQuestions === 0
      ? 0
      : Math.round(
          (answeredCount / totalQuestions) *
          100
        );


  // --------------------------------------------------
  // SELECT QUESTION
  // --------------------------------------------------

  const handleQuestionSelect = (item) => {

    setSelectedQuestion(item);

    setAnswer(item.answer || "");

    setCompany(item.company || "");

    setRound(
      item.round ||
      item.category ||
      activeCategory
    );

    setEditingId(item.id);
  };


  // --------------------------------------------------
  // SAVE ANSWER
  // --------------------------------------------------

  const handleSaveAnswer = async (e) => {

    e.preventDefault();

    if (!selectedQuestion) {

      alert("Please select a question.");

      return;
    }


    if (!auth.currentUser) {

      alert("Please login first.");

      return;
    }


    if (!answer.trim()) {

      alert("Please write your answer.");

      return;
    }


    try {

      if (editingId) {

        await updateDoc(
          doc(
            db,
            "interviewAnswers",
            editingId
          ),
          {
            answer: answer,
            company: company,
            round: round,
            updatedAt:
              serverTimestamp()
          }
        );

        alert(
          "Answer updated successfully!"
        );

      } else {

        await addDoc(
          collection(
            db,
            "interviewAnswers"
          ),
          {
            question:
              selectedQuestion.question,

            category:
              selectedQuestion.category,

            company:
              company,

            round:
              round,

            answer:
              answer,

            userId:
              auth.currentUser.uid,

            createdAt:
              serverTimestamp()
          }
        );

        alert(
          "Answer saved successfully!"
        );

      }


      setSelectedQuestion(null);
      setAnswer("");
      setCompany("");
      setRound(activeCategory);
      setEditingId(null);


    } catch (error) {

      console.log(error);

      alert(
        "Failed to save answer."
      );

    }

  };


  // --------------------------------------------------
  // ADD NEW QUESTION
  // --------------------------------------------------

  const handleAddQuestion = async (e) => {

    e.preventDefault();

    if (!questionText.trim()) {

      alert(
        "Please enter the question."
      );

      return;
    }


    if (!auth.currentUser) {

      alert(
        "Please login first."
      );

      return;
    }


    try {

      await addDoc(
        collection(
          db,
          "interviewAnswers"
        ),
        {
          question:
            questionText,

          category:
            activeCategory,

          company:
            company,

          round:
            round,

          answer:
            "",

          userId:
            auth.currentUser.uid,

          createdAt:
            serverTimestamp()
        }
      );


      alert(
        "Interview question added!"
      );


      setQuestionText("");
      setCompany("");
      setRound(activeCategory);
      setShowAddQuestion(false);


    } catch (error) {

      console.log(error);

      alert(
        "Failed to add question."
      );

    }

  };


  // --------------------------------------------------
  // EDIT QUESTION DETAILS
  // --------------------------------------------------

  const handleEditQuestion = async () => {

    if (!editingId) {

      alert(
        "This is a default question. Save an answer first to store it."
      );

      return;
    }


    try {

      await updateDoc(
        doc(
          db,
          "interviewAnswers",
          editingId
        ),
        {
          question:
            selectedQuestion.question,

          company:
            company,

          round:
            round,

          updatedAt:
            serverTimestamp()
        }
      );


      alert(
        "Question details updated!"
      );


    } catch (error) {

      console.log(error);

      alert(
        "Failed to update question."
      );

    }

  };


  // --------------------------------------------------
  // DELETE QUESTION
  // --------------------------------------------------

  const handleDeleteQuestion =
    async (id) => {

      if (!id) {

        alert(
          "Default questions cannot be deleted."
        );

        return;
      }


      const confirmDelete =
        window.confirm(
          "Delete this interview question and its answer?"
        );


      if (!confirmDelete) {
        return;
      }


      try {

        await deleteDoc(
          doc(
            db,
            "interviewAnswers",
            id
          )
        );


        if (
          editingId === id
        ) {

          setSelectedQuestion(null);
          setAnswer("");
          setCompany("");
          setEditingId(null);

        }


        alert(
          "Question deleted successfully!"
        );


      } catch (error) {

        console.log(error);

        alert(
          "Failed to delete question."
        );

      }

    };


  // --------------------------------------------------
  // CHANGE CATEGORY
  // --------------------------------------------------

  const handleCategoryChange =
    (category) => {

      setActiveCategory(category);

      setSelectedQuestion(null);

      setAnswer("");

      setCompany("");

      setRound(category);

      setEditingId(null);

    };


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <div className="interview-page">


      {/* =========================
          HEADER
      ========================= */}

      <div className="interview-header">

        <h1>
          Interview Prep
        </h1>

        <p>
          Build your personal interview
          question bank and prepare answers
          based on real company interviews.
        </p>

      </div>


      <div className="interview-container">


        {/* =========================
            CATEGORY TABS
        ========================= */}

        <div className="interview-card">

          <div className="category-tabs">

            <button
              className={
                activeCategory === "HR"
                  ? "category-btn active"
                  : "category-btn"
              }
              onClick={() =>
                handleCategoryChange("HR")
              }
            >
              HR Questions
            </button>


            <button
              className={
                activeCategory === "Technical"
                  ? "category-btn active"
                  : "category-btn"
              }
              onClick={() =>
                handleCategoryChange(
                  "Technical"
                )
              }
            >
              Technical Questions
            </button>

          </div>

        </div>


        {/* =========================
            PROGRESS
        ========================= */}

        <div className="interview-card">

          <div className="progress-header">

            <div>

              <h2>
                {activeCategory} Preparation
              </h2>

              <p>
                {answeredCount} /{" "}
                {totalQuestions} questions prepared
              </p>

            </div>

            <div className="progress-percentage">
              {progress}%
            </div>

          </div>


          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`
              }}
            />

          </div>


          <p className="progress-text">
            {progress}% complete
          </p>

        </div>


        {/* =========================
            ADD QUESTION
        ========================= */}

        <div className="interview-card">

          <button
            className="primary-btn"
            onClick={() =>
              setShowAddQuestion(
                !showAddQuestion
              )
            }
          >
            {showAddQuestion
              ? "Cancel"
              : "+ Add Interview Question"}
          </button>


          {showAddQuestion && (

            <form
              className="add-question-form"
              onSubmit={
                handleAddQuestion
              }
            >

              <h2>
                Add Interview Question
              </h2>


              <div className="form-group">

                <label>
                  Interview Question
                </label>

                <input
                  type="text"
                  placeholder="Enter interview question"
                  value={questionText}
                  onChange={(e) =>
                    setQuestionText(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Company
                </label>

                <input
                  type="text"
                  placeholder="Company name (Example: Visa)"
                  value={company}
                  onChange={(e) =>
                    setCompany(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="form-group">

                <label>
                  Interview Round
                </label>

                <select
                  value={round}
                  onChange={(e) =>
                    setRound(
                      e.target.value
                    )
                  }
                >

                  <option value="HR">
                    HR
                  </option>

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="Managerial">
                    Managerial
                  </option>

                </select>

              </div>


              <button
                className="primary-btn"
                type="submit"
              >
                Add Question
              </button>

            </form>

          )}

        </div>


        {/* =========================
            MAIN SECTION
        ========================= */}

        <div className="interview-main">


          {/* =========================
              QUESTION LIST
          ========================= */}

          <div className="interview-card question-card">

            <h2>
              {activeCategory} Questions
            </h2>


            <div className="question-list">

              {displayedQuestions.map(
                (item, index) => {

                  const isAnswered =
                    item.answer &&
                    item.answer.trim() !== "";


                  const isSelected =
                    selectedQuestion &&
                    (
                      selectedQuestion.id ===
                      item.id
                    );


                  return (

                    <div
                      className={
                        isSelected
                          ? "question-item selected"
                          : "question-item"
                      }
                      key={
                        item.id ||
                        `default-${index}`
                      }
                    >

                      <button
                        className="question-btn"
                        onClick={() =>
                          handleQuestionSelect(
                            item
                          )
                        }
                      >

                        <span className="question-status">
                          {isAnswered
                            ? "✅"
                            : "⬜"}
                        </span>

                        <span className="question-number">
                          {index + 1}.
                        </span>

                        <span className="question-text">
                          {item.question}
                        </span>

                      </button>


                      <div className="question-meta">

                        {item.company && (

                          <span>
                            🏢 {item.company}
                          </span>

                        )}


                        {item.round && (

                          <span>
                            Round: {item.round}
                          </span>

                        )}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* =========================
              ANSWER PANEL
          ========================= */}

          <div className="interview-card answer-card">

            <h2>
              Your Preparation
            </h2>


            {!selectedQuestion ? (

              <div className="empty-state">

                <div className="empty-icon">
                  📝
                </div>

                <p>
                  Select a question to prepare
                  your answer.
                </p>

              </div>

            ) : (

              <form
                className="answer-form"
                onSubmit={
                  handleSaveAnswer
                }
              >

                <div className="selected-question">

                  <span>
                    Question
                  </span>

                  <h3>
                    {selectedQuestion.question}
                  </h3>

                </div>


                <p className="category-info">

                  Category:{" "}
                  <strong>
                    {selectedQuestion.category}
                  </strong>

                </p>


                <div className="form-group">

                  <label>
                    Company
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Visa"
                    value={company}
                    onChange={(e) =>
                      setCompany(
                        e.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Interview Round
                  </label>

                  <select
                    value={round}
                    onChange={(e) =>
                      setRound(
                        e.target.value
                      )
                    }
                  >

                    <option value="HR">
                      HR
                    </option>

                    <option value="Technical">
                      Technical
                    </option>

                    <option value="Managerial">
                      Managerial
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Your Answer
                  </label>

                  <textarea
                    rows="10"
                    placeholder="Write your answer here..."
                    value={answer}
                    onChange={(e) =>
                      setAnswer(
                        e.target.value
                      )
                    }
                  />

                </div>


                <p className="character-count">
                  Characters: {answer.length}
                </p>


                <div className="answer-actions">

                  <button
                    className="primary-btn"
                    type="submit"
                  >
                    {editingId
                      ? "Update Answer"
                      : "Save Answer"}
                  </button>


                  {editingId && (

                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={
                        handleEditQuestion
                      }
                    >
                      Update Question Details
                    </button>

                  )}

                </div>

              </form>

            )}

          </div>

        </div>


        {/* =========================
            SAVED QUESTIONS
        ========================= */}

        <div className="interview-card">

          <h2>
            My Interview Questions
          </h2>


          {questions.length === 0 ? (

            <div className="empty-saved">

              <p>
                You haven't added any
                company-specific questions yet.
              </p>

            </div>

          ) : (

            <div className="saved-question-list">

              {questions
                .filter(
                  (item) =>
                    item.category ===
                    activeCategory
                )
                .map((item) => (

                  <div
                    className="saved-question-item"
                    key={item.id}
                  >

                    <div className="saved-question-info">

                      <h3>
                        {item.question}
                      </h3>


                      {item.company && (

                        <p>
                          🏢 Company:{" "}
                          {item.company}
                        </p>

                      )}


                      <p>
                        📌 Round:{" "}
                        {item.round}
                      </p>


                      <p
                        className={
                          item.answer
                            ? "answer-status prepared"
                            : "answer-status not-prepared"
                        }
                      >
                        {item.answer
                          ? "✅ Answer prepared"
                          : "⬜ Answer not prepared"}
                      </p>

                    </div>


                    <div className="saved-question-actions">

                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleQuestionSelect(
                            item
                          )
                        }
                      >
                        Edit
                      </button>


                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDeleteQuestion(
                            item.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );
}

export default InterviewPrep;