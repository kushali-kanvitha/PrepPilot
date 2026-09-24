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

    <div>

      <h1>Interview Calendar</h1>

      <p>
        Track your upcoming OAs,
        interviews and placement events.
      </p>

      <hr />

      {/* ADD / EDIT FORM */}

      <h2>
        {editingId
          ? "Edit Interview"
          : "Add Interview"}
      </h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Company name"
          value={company}
          onChange={(e) =>
            setCompany(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>
          Event Type:
        </label>

        {" "}

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

        <br />
        <br />

        <label>
          Round:
        </label>

        {" "}

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

        <br />
        <br />

        <label>
          Date:
        </label>

        {" "}

        <input
          type="date"
          value={date}
          onChange={(e) =>
            setDate(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>
          Time:
        </label>

        {" "}

        <input
          type="time"
          value={time}
          onChange={(e) =>
            setTime(e.target.value)
          }
          required
        />

        <br />
        <br />

        <label>
          Status:
        </label>

        {" "}

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

        <br />
        <br />

        <textarea
          rows="4"
          cols="50"
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
        />

        <br />
        <br />

        <button type="submit">

          {editingId
            ? "Update Interview"
            : "Add Interview"}

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

      {/* INTERVIEW LIST */}

      <h2>My Interviews</h2>

      {sortedEvents.length === 0 ? (

        <p>
          No interviews added yet.
        </p>

      ) : (

        sortedEvents.map((event) => (

          <div
            key={event.id}
          >

            <h3>
              {event.company}
            </h3>

            <p>
              📌 Type: {event.type}
            </p>

            <p>
              🎯 Round: {event.round}
            </p>

            <p>
              📅 Date: {event.date}
            </p>

            <p>
              ⏰ Time: {event.time}
            </p>

            <p>
              📊 Status: {event.status}
            </p>

            {event.notes && (

              <p>
                📝 Notes: {event.notes}
              </p>

            )}

            <button
              onClick={() =>
                handleEdit(event)
              }
            >
              Edit
            </button>

            {" "}

            <button
              onClick={() =>
                handleDelete(event.id)
              }
            >
              Delete
            </button>

            <hr />

          </div>

        ))

      )}

    </div>

  );
}

export default Calendar;