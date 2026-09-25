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

import "./Notes.css";

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

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
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
    <div className="notes-page">

      <div className="notes-container">

        {/* HEADER */}

        <div className="notes-header">

          <h1>Notes</h1>

          <p>
            Save important placement preparation
            notes, company notes and interview notes.
          </p>

        </div>


        {/* ADD / EDIT NOTE */}

        <div className="notes-card">

          <h2>
            {editingId
              ? "Edit Note"
              : "Add Note"}
          </h2>

          <form
            className="notes-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Note Title
              </label>

              <input
                type="text"
                placeholder="Example: DBMS Normalization"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                Note Content
              </label>

              <textarea
                placeholder="Write your note..."
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                rows="8"
                required
              />

            </div>


            <div className="notes-form-actions">

              <button
                type="submit"
                className="primary-btn"
              >
                {editingId
                  ? "Update Note"
                  : "Add Note"}
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


        {/* NOTES LIST */}

        <div className="notes-card">

          <div className="notes-list-header">

            <div>

              <h2>
                My Notes
              </h2>

              <p>
                {notes.length} note
                {notes.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>


          {notes.length === 0 ? (

            <div className="empty-notes">

              <div className="empty-notes-icon">
                📝
              </div>

              <h3>
                No notes added yet
              </h3>

              <p>
                Add your first placement
                preparation note above.
              </p>

            </div>

          ) : (

            <div className="notes-list">

              {notes.map((note) => (

                <div
                  className="note-item"
                  key={note.id}
                >

                  <div className="note-content">

                    <h3>
                      {note.title}
                    </h3>

                    <p>
                      {note.content}
                    </p>

                  </div>


                  <div className="note-actions">

                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(note)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(note.id)
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

export default Notes;