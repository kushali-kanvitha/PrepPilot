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

function Goals() {
  const [goals, setGoals] = useState([]);

  const [goalText, setGoalText] = useState("");
  const [target, setTarget] = useState("");
  const [completed, setCompleted] = useState(0);
  const [period, setPeriod] = useState("Weekly");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let unsubscribeGoals;

    const unsubscribeAuth =
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setGoals([]);
          return;
        }

        const q = query(
          collection(db, "goals"),
          where("userId", "==", user.uid)
        );

        unsubscribeGoals = onSnapshot(
          q,
          (snapshot) => {
            const goalList = snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data()
              })
            );

            setGoals(goalList);
          },
          (error) => {
            console.log(
              "Error loading goals:",
              error
            );
          }
        );
      });

    return () => {
      unsubscribeAuth();

      if (unsubscribeGoals) {
        unsubscribeGoals();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first.");
      return;
    }

    if (!goalText.trim()) {
      alert("Please enter a goal.");
      return;
    }

    if (!target || Number(target) <= 0) {
      alert("Please enter a valid target.");
      return;
    }

    if (
      Number(completed) < 0 ||
      Number(completed) > Number(target)
    ) {
      alert(
        "Completed value must be between 0 and the target."
      );
      return;
    }

    try {
      const goalData = {
        goalText,
        target: Number(target),
        completed: Number(completed),
        period
      };

      if (editingId) {
        await updateDoc(
          doc(db, "goals", editingId),
          {
            ...goalData,
            updatedAt: serverTimestamp()
          }
        );

        alert("Goal updated successfully!");
      } else {
        await addDoc(
          collection(db, "goals"),
          {
            ...goalData,
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          }
        );

        alert("Goal added successfully!");
      }

      resetForm();
    } catch (error) {
      console.log(error);
      alert("Failed to save goal.");
    }
  };

  const resetForm = () => {
    setGoalText("");
    setTarget("");
    setCompleted(0);
    setPeriod("Weekly");
    setEditingId(null);
  };

  const handleEdit = (goal) => {
    setGoalText(goal.goalText || "");
    setTarget(goal.target || "");
    setCompleted(goal.completed || 0);
    setPeriod(goal.period || "Weekly");
    setEditingId(goal.id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this goal?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "goals", id)
      );

      alert("Goal deleted successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to delete goal.");
    }
  };

  const handleIncrease = async (goal) => {
    if (goal.completed >= goal.target) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "goals", goal.id),
        {
          completed:
            Number(goal.completed) + 1,
          updatedAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.log(error);
      alert("Failed to update progress.");
    }
  };

  return (
    <div>
      <h1>Goals</h1>

      <p>
        Set and track your placement
        preparation goals.
      </p>

      <hr />

      <h2>
        {editingId
          ? "Edit Goal"
          : "Add Goal"}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Example: Solve DSA problems"
          value={goalText}
          onChange={(e) =>
            setGoalText(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>Target:</label>{" "}

        <input
          type="number"
          min="1"
          value={target}
          onChange={(e) =>
            setTarget(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>Completed:</label>{" "}

        <input
          type="number"
          min="0"
          value={completed}
          onChange={(e) =>
            setCompleted(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>Period:</label>{" "}

        <select
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value)
          }
        >
          <option value="Daily">
            Daily
          </option>

          <option value="Weekly">
            Weekly
          </option>

          <option value="Monthly">
            Monthly
          </option>
        </select>

        <br />
        <br />

        <button type="submit">
          {editingId
            ? "Update Goal"
            : "Add Goal"}
        </button>

        {" "}

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
          >
            Cancel Edit
          </button>
        )}
      </form>

      <hr />

      <h2>My Goals</h2>

      {goals.length === 0 ? (
        <p>
          No goals added yet.
        </p>
      ) : (
        goals.map((goal) => {
          const progress =
            goal.target === 0
              ? 0
              : Math.round(
                  (goal.completed /
                    goal.target) *
                    100
                );

          return (
            <div key={goal.id}>
              <h3>
                {goal.goalText}
              </h3>

              <p>
                📅 Period:{" "}
                {goal.period}
              </p>

              <p>
                🎯 Progress:{" "}
                {goal.completed} /{" "}
                {goal.target}
              </p>

              <progress
                value={goal.completed}
                max={goal.target}
              />

              <p>
                {progress}% complete
              </p>

              <button
                onClick={() =>
                  handleIncrease(goal)
                }
              >
                +1 Completed
              </button>

              {" "}

              <button
                onClick={() =>
                  handleEdit(goal)
                }
              >
                Edit
              </button>

              {" "}

              <button
                onClick={() =>
                  handleDelete(goal.id)
                }
              >
                Delete
              </button>

              <hr />
            </div>
          );
        })
      )}
    </div>
  );
}

export default Goals;