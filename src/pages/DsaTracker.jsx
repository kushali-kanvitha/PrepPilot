import { useEffect, useState } from "react";
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

import { db, auth } from "../firebase/firebase";
import "./DsaTracker.css";

function DsaTracker() {
  const [problem, setProblem] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterTopic, setFilterTopic] = useState("All");

  const [problems, setProblems] = useState([]);

  // Get problems from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    const q = query(
      collection(db, "dsaProblems"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const problemList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setProblems(problemList);
    });

    return () => unsubscribe();
  }, []);

  // Delete problem
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "dsaProblems", id));

      alert("Problem deleted successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to delete problem");
    }
  };

  // Edit problem
  const handleEdit = async (item) => {
    const newProblem = prompt(
      "Enter problem name:",
      item.problem
    );

    const newTopic = prompt(
      "Enter topic:",
      item.topic
    );

    const newDifficulty = prompt(
      "Enter difficulty (Easy/Medium/Hard):",
      item.difficulty
    );

    if (!newProblem || !newTopic || !newDifficulty) {
      return;
    }

    try {
      await updateDoc(doc(db, "dsaProblems", item.id), {
        problem: newProblem,
        topic: newTopic,
        difficulty: newDifficulty
      });

      alert("Problem updated successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to update problem");
    }
  };

  // Add problem
  const handleAddProblem = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "dsaProblems"), {
  problem: problem,
  topic: topic,
  difficulty: difficulty,
  status: "Solved",
  userId: auth.currentUser.uid,
  dateSolved: serverTimestamp(),
  createdAt: serverTimestamp()
});

      alert("Problem added successfully!");

      setProblem("");
      setTopic("");
      setDifficulty("Easy");

    } catch (error) {
      console.log(error);
      alert("Failed to add problem");
    }
  };

  // Get unique topics
  const topics = [
    ...new Set(problems.map((item) => item.topic))
  ];

  return (
  <div className="dsa-page">

    <div className="dsa-header">
      <h1>DSA Tracker</h1>

      <p>
        Track your DSA preparation and problem-solving progress.
      </p>
    </div>

    {/* Add Problem Form */}
    <div className="dsa-card">

      <h2>Add New Problem</h2>

      <form
        className="dsa-form"
        onSubmit={handleAddProblem}
      >

        <input
          type="text"
          placeholder="Problem name"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <button
          className="dsa-add-btn"
          type="submit"
        >
          Add Problem
        </button>

      </form>

    </div>

    {/* Filters */}
    <div className="dsa-card">

      <div className="dsa-filter-header">
        <h2>Filter Problems</h2>
      </div>

      <div className="dsa-filters">

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="All">
            All Difficulties
          </option>

          <option value="Easy">
            Easy
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="Hard">
            Hard
          </option>
        </select>

        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
        >
          <option value="All">
            All Topics
          </option>

          {topics.map((topic) => (
            <option
              key={topic}
              value={topic}
            >
              {topic}
            </option>
          ))}

        </select>

      </div>

    </div>

    {/* Problems */}
    <div className="dsa-card">

      <div className="dsa-problems-header">

        <div>
          <h2>Problems Solved</h2>

          <p>
            {problems.length} problems
          </p>
        </div>

      </div>

      <div className="dsa-problem-list">

        {problems
          .filter(
            (item) =>
              (filterDifficulty === "All" ||
                item.difficulty === filterDifficulty) &&
              (filterTopic === "All" ||
                item.topic === filterTopic)
          )
          .map((item) => (

            <div
              className="dsa-problem"
              key={item.id}
            >

              <div className="dsa-problem-info">

                <h3>
                  {item.problem}
                </h3>

                <p>
                  Topic: {item.topic}
                </p>

                <span
                  className={`dsa-difficulty ${item.difficulty.toLowerCase()}`}
                >
                  {item.difficulty}
                </span>

              </div>

              <div className="dsa-actions">

                <button
                  className="dsa-edit-btn"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>

                <button
                  className="dsa-delete-btn"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

      </div>

    </div>

  </div>
);
}

export default DsaTracker;