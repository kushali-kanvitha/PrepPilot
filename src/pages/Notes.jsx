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

function Notes() {
  const [notes, setNotes] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let unsubscribeNotes;

    const unsubscribeAuth =
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          setNotes([]);
          return;
        }

        const notesQuery = query(
          collection(db, "notes"),
          where("userId", "==", user.uid)
        );

        unsubscribeNotes = onSnapshot(
          notesQuery,
          (snapshot) => {
            const noteList = snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data()
              })
            );

            setNotes(noteList);
          },
          (error) => {
            console.log(
              "Error loading notes:",
              error
            );
          }
        );
      });

    return () => {
      unsubscribeAuth();

      if (unsubscribeNotes) {
        unsubscribeNotes();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login first.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a note title.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter note content.");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(
          doc(db, "notes", editingId),
          {
            title: title,
            content: content,
            updatedAt: serverTimestamp()
          }
        );

        alert("Note updated successfully!");
      } else {
        await addDoc(
          collection(db, "notes"),
          {
            title: title,
            content: content,
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          }
        );

        alert("Note added successfully!");
      }

      resetForm();
    } catch (error) {
      console.log(error);
      alert("Failed to save note.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const handleEdit = (note) => {
    setTitle(note.title || "");
    setContent(note.content || "");
    setEditingId(note.id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "notes", id)
      );

      alert("Note deleted successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to delete note.");
    }
  };

  return (
    <div>
      <h1>Notes</h1>

      <p>
        Save important placement preparation
        notes, company notes and interview notes.
      </p>

      <hr />

      <h2>
        {editingId
          ? "Edit Note"
          : "Add Note"}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Note title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
        />

        <br />
        <br />

        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          rows="8"
          cols="50"
          required
        />

        <br />
        <br />

        <button type="submit">
          {editingId
            ? "Update Note"
            : "Add Note"}
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

      <h2>My Notes</h2>

      {notes.length === 0 ? (
        <p>
          No notes added yet.
        </p>
      ) : (
        notes.map((note) => (
          <div key={note.id}>
            <h3>{note.title}</h3>

            <p>
              {note.content}
            </p>

            <button
              onClick={() =>
                handleEdit(note)
              }
            >
              Edit
            </button>

            {" "}

            <button
              onClick={() =>
                handleDelete(note.id)
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

export default Notes;