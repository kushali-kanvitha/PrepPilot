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
    <div>
      <h1>DSA Tracker</h1>

      <p>
        Track your DSA preparation and problem-solving progress.
      </p>

      {/* Add Problem Form */}

      <form onSubmit={handleAddProblem}>

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

        <button type="submit">
          Add Problem
        </button>

      </form>

      <hr />

      {/* Difficulty Filter */}

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

      {/* Topic Filter */}

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

      <h3>Problems Solved</h3>

      <p>
        {problems.length} problems
      </p>

      {/* Display Filtered Problems */}

      {problems
        .filter(
          (item) =>
            (filterDifficulty === "All" ||
              item.difficulty === filterDifficulty) &&
            (filterTopic === "All" ||
              item.topic === filterTopic)
        )
        .map((item) => (

          <div key={item.id}>

            <h4>
              {item.problem}
            </h4>

            <p>
              Topic: {item.topic}
            </p>

            <p>
              Difficulty: {item.difficulty}
            </p>

            <button
              onClick={() => handleEdit(item)}
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </button>

            <hr />

          </div>

        ))}

    </div>
  );
}

export default DsaTracker;