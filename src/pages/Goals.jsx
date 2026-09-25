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

import "./Goals.css";

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

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
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
    <div className="goals-page">

      <div className="goals-container">

        {/* HEADER */}

        <div className="goals-header">

          <h1>Goals</h1>

          <p>
            Set and track your placement
            preparation goals.
          </p>

        </div>


        {/* ADD / EDIT GOAL */}

        <div className="goals-card">

          <h2>
            {editingId
              ? "Edit Goal"
              : "Add Goal"}
          </h2>

          <form
            className="goals-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Goal
              </label>

              <input
                type="text"
                placeholder="Example: Solve DSA problems"
                value={goalText}
                onChange={(e) =>
                  setGoalText(e.target.value)
                }
                required
              />

            </div>


            <div className="form-row">

              <div className="form-group">

                <label>
                  Target
                </label>

                <input
                  type="number"
                  min="1"
                  value={target}
                  placeholder="Example: 20"
                  onChange={(e) =>
                    setTarget(e.target.value)
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Completed
                </label>

                <input
                  type="number"
                  min="0"
                  value={completed}
                  onChange={(e) =>
                    setCompleted(e.target.value)
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Period
                </label>

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

              </div>

            </div>


            <div className="goal-form-actions">

              <button
                type="submit"
                className="primary-btn"
              >
                {editingId
                  ? "Update Goal"
                  : "Add Goal"}
              </button>

              {editingId && (

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>

              )}

            </div>

          </form>

        </div>


        {/* GOAL LIST */}

        <div className="goals-card">

          <div className="goals-list-header">

            <div>

              <h2>
                My Goals
              </h2>

              <p>
                {goals.length} goal
                {goals.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>


          {goals.length === 0 ? (

            <div className="empty-goals">

              <div className="empty-goal-icon">
                🎯
              </div>

              <h3>
                No goals added yet
              </h3>

              <p>
                Add your first placement
                preparation goal above.
              </p>

            </div>

          ) : (

            <div className="goals-list">

              {goals.map((goal) => {

                const progress =
                  goal.target === 0
                    ? 0
                    : Math.round(
                        (goal.completed /
                          goal.target) *
                          100
                      );

                return (

                  <div
                    className="goal-item"
                    key={goal.id}
                  >

                    <div className="goal-top">

                      <div>

                        <h3>
                          {goal.goalText}
                        </h3>

                        <span className="period-badge">
                          {goal.period}
                        </span>

                      </div>

                      <div className="progress-percentage">
                        {progress}%
                      </div>

                    </div>


                    <div className="goal-progress-info">

                      <span>
                        {goal.completed} / {goal.target} completed
                      </span>

                      <span>
                        {goal.target - goal.completed} remaining
                      </span>

                    </div>


                    <div className="progress-bar">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${progress}%`
                        }}
                      />

                    </div>


                    <div className="goal-actions">

                      <button
                        className="complete-btn"
                        onClick={() =>
                          handleIncrease(goal)
                        }
                        disabled={
                          goal.completed >=
                          goal.target
                        }
                      >
                        +1 Completed
                      </button>


                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(goal)
                        }
                      >
                        Edit
                      </button>


                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(goal.id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Goals;