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

import "./Calendar.css";

function Calendar() {

  const [events, setEvents] = useState([]);

  const [company, setCompany] = useState("");
  const [type, setType] = useState("OA");
  const [round, setRound] = useState("Technical");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);

  // Load interview events
  useEffect(() => {

    let unsubscribeEvents;

    const unsubscribeAuth =
      onAuthStateChanged(auth, (user) => {

        if (!user) {
          setEvents([]);
          return;
        }

        const q = query(
          collection(db, "interviewEvents"),
          where("userId", "==", user.uid)
        );

        unsubscribeEvents = onSnapshot(
          q,
          (snapshot) => {

            const eventList =
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
              }));

            setEvents(eventList);
          },
          (error) => {
            console.log(
              "Error loading interview events:",
              error
            );
          }
        );

      });

    return () => {

      unsubscribeAuth();

      if (unsubscribeEvents) {
        unsubscribeEvents();
      }

    };

  }, []);

  // Add / update event
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first.");
      return;
    }

    if (!company || !date || !time) {
      alert(
        "Please enter company, date and time."
      );
      return;
    }

    try {

      const eventData = {
        company,
        type,
        round,
        date,
        time,
        status,
        notes
      };

      if (editingId) {

        await updateDoc(
          doc(
            db,
            "interviewEvents",
            editingId
          ),
          {
            ...eventData,
            updatedAt: serverTimestamp()
          }
        );

        alert(
          "Interview updated successfully!"
        );

      } else {

        await addDoc(
          collection(
            db,
            "interviewEvents"
          ),
          {
            ...eventData,
            userId:
              auth.currentUser.uid,
            createdAt:
              serverTimestamp()
          }
        );

        alert(
          "Interview added successfully!"
        );
      }

      resetForm();

    } catch (error) {

      console.log(error);

      alert(
        "Failed to save interview."
      );
    }
  };

  // Reset form
  const resetForm = () => {

    setCompany("");
    setType("OA");
    setRound("Technical");
    setDate("");
    setTime("");
    setStatus("Upcoming");
    setNotes("");
    setEditingId(null);

  };

  // Edit event
  const handleEdit = (event) => {

    setCompany(event.company || "");
    setType(event.type || "OA");
    setRound(
      event.round || "Technical"
    );
    setDate(event.date || "");
    setTime(event.time || "");
    setStatus(
      event.status || "Upcoming"
    );
    setNotes(event.notes || "");

    setEditingId(event.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Delete event
  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this interview event?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await deleteDoc(
        doc(
          db,
          "interviewEvents",
          id
        )
      );

      alert(
        "Interview deleted successfully!"
      );

    } catch (error) {

      console.log(error);

      alert(
        "Failed to delete interview."
      );
    }
  };

  // Sort events by date and time
  const sortedEvents = [...events].sort(
    (a, b) => {

      const first =
        new Date(
          `${a.date}T${a.time}`
        );

      const second =
        new Date(
          `${b.date}T${b.time}`
        );

      return first - second;
    }
  );

  return (

    <div className="calendar-page">

      <div className="calendar-container">

        {/* HEADER */}

        <div className="calendar-header">

          <h1>Interview Calendar</h1>

          <p>
            Track your upcoming OAs,
            interviews and placement events.
          </p>

        </div>

        {/* ADD / EDIT FORM */}

        <div className="calendar-card">

          <h2>
            {editingId
              ? "Edit Interview"
              : "Add Interview"}
          </h2>

          <form
            className="calendar-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Company Name
              </label>

              <input
                type="text"
                placeholder="Enter company name"
                value={company}
                onChange={(e) =>
                  setCompany(e.target.value)
                }
                required
              />

            </div>

            <div className="form-row">

              <div className="form-group">

                <label>
                  Event Type
                </label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                >

                  <option value="OA">
                    Online Assessment
                  </option>

                  <option value="Interview">
                    Interview
                  </option>

                  <option value="Coding Test">
                    Coding Test
                  </option>

                  <option value="Group Discussion">
                    Group Discussion
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Round
                </label>

                <select
                  value={round}
                  onChange={(e) =>
                    setRound(e.target.value)
                  }
                >

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Managerial">
                    Managerial
                  </option>

                  <option value="Coding">
                    Coding
                  </option>

                  <option value="Aptitude">
                    Aptitude
                  </option>

                </select>

              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Time
                </label>

                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >

                <option value="Upcoming">
                  Upcoming
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Notes
              </label>

              <textarea
                rows="4"
                placeholder="Add any notes about this event..."
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
              />

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="primary-btn"
              >
                {editingId
                  ? "Update Interview"
                  : "Add Interview"}
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

        {/* INTERVIEW LIST */}

        <div className="calendar-card">

          <div className="list-header">

            <div>

              <h2>My Interviews</h2>

              <p>
                {events.length} event
                {events.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>

          {sortedEvents.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📅
              </div>

              <h3>
                No interviews added yet
              </h3>

              <p>
                Add your upcoming OAs,
                interviews and placement
                events above.
              </p>

            </div>

          ) : (

            <div className="events-list">

              {sortedEvents.map((event) => (

                <div
                  className="event-card"
                  key={event.id}
                >

                  <div className="event-top">

                    <div>

                      <h3>
                        {event.company}
                      </h3>

                      <div className="event-tags">

                        <span className="tag">
                          {event.type}
                        </span>

                        <span className="tag">
                          {event.round}
                        </span>

                      </div>

                    </div>

                    <span
                      className={`status-badge status-${event.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {event.status}
                    </span>

                  </div>

                  <div className="event-details">

                    <div className="detail-item">

                      <span className="detail-label">
                        📅 Date
                      </span>

                      <span>
                        {event.date}
                      </span>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        ⏰ Time
                      </span>

                      <span>
                        {event.time}
                      </span>

                    </div>

                  </div>

                  {event.notes && (

                    <div className="event-notes">

                      <strong>
                        📝 Notes
                      </strong>

                      <p>
                        {event.notes}
                      </p>

                    </div>

                  )}

                  <div className="event-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(event)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(event.id)
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

export default Calendar;