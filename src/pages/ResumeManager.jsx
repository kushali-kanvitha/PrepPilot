import { useEffect, useState } from "react";
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

import { db, auth } from "../firebase/firebase";
import "./ResumeManager.css";


function ResumeManager() {

  const [resumeName, setResumeName] = useState("");
  const [version, setVersion] = useState("");
  const [resume, setResume] = useState(null);

  const [resumes, setResumes] = useState([]);


  // Get resumes from Firestore
  useEffect(() => {

    let unsubscribeResumes;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      // If user is not logged in
      if (!user) {
        setResumes([]);
        return;
      }

      // Get resumes belonging to this user
      const q = query(
        collection(db, "resumes"),
        where("userId", "==", user.uid)
      );

      unsubscribeResumes = onSnapshot(
        q,
        (snapshot) => {

          const resumeList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          setResumes(resumeList);

        },
        (error) => {

          console.log("Error getting resumes:", error);

        }
      );

    });


    // Cleanup
    return () => {

      unsubscribeAuth();

      if (unsubscribeResumes) {
        unsubscribeResumes();
      }

    };

  }, []);


  // Select PDF
  const handleResumeSelect = (e) => {

    const file = e.target.files[0];

    if (file) {
      setResume(file);
    }

  };


  // Save resume details
  const handleSaveResume = async (e) => {

    e.preventDefault();

    if (!resume) {
      alert("Please select a resume");
      return;
    }

    if (!auth.currentUser) {
      alert("Please login first");
      return;
    }

    try {

      await addDoc(
        collection(db, "resumes"),
        {
          resumeName: resumeName,
          version: version,
          fileName: resume.name,
          fileSize: resume.size,

          userId: auth.currentUser.uid,

          isCurrent: resumes.length === 0,

          createdAt: serverTimestamp()
        }
      );

      alert("Resume saved successfully!");

      setResumeName("");
      setVersion("");
      setResume(null);

    } catch (error) {

      console.log(error);

      alert("Failed to save resume");

    }

  };


  // Delete resume
  const handleDelete = async (id) => {

    try {

      await deleteDoc(
        doc(db, "resumes", id)
      );

      alert("Resume deleted successfully!");

    } catch (error) {

      console.log(error);

      alert("Failed to delete resume");

    }

  };


  // Make current resume
  const handleMakeCurrent = async (id) => {

    try {

      // Make all resumes not current
      for (const item of resumes) {

        await updateDoc(
          doc(db, "resumes", item.id),
          {
            isCurrent: false
          }
        );

      }


      // Make selected resume current
      await updateDoc(
        doc(db, "resumes", id),
        {
          isCurrent: true
        }
      );

      alert("Current resume updated!");

    } catch (error) {

      console.log(error);

      alert("Failed to update current resume");

    }

  };


  return (
  <div className="resume-page">

    <div className="resume-header">
      <h1>Resume Manager</h1>

      <p>
        Manage your resume versions for placement applications.
      </p>
    </div>

    <div className="resume-container">

      {/* Add Resume */}
      <div className="resume-card">

        <h2>Add New Resume</h2>

        <form
          className="resume-form"
          onSubmit={handleSaveResume}
        >

          <input
            type="text"
            placeholder="Resume name"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Version (Example: V1, V2)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />

          <input
            className="resume-file"
            type="file"
            accept=".pdf"
            onChange={handleResumeSelect}
            required
          />

          <button
            className="resume-save-btn"
            type="submit"
          >
            Save Resume
          </button>

        </form>

      </div>


      {/* Resume List */}
      <div className="resume-card">

        <div className="resume-list-header">
          <div>
            <h2>My Resumes</h2>

            <p>
              {resumes.length} resume
              {resumes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>


        {resumes.length === 0 && (
          <div className="resume-empty">
            <div className="resume-empty-icon">
              📄
            </div>

            <h3>No resumes added yet</h3>

            <p>
              Add your first resume above to start managing your versions.
            </p>
          </div>
        )}


        <div className="resume-list">

          {resumes.map((item) => (

            <div
              className="resume-item"
              key={item.id}
            >

              <div className="resume-info">

                <div className="resume-icon">
                  📄
                </div>

                <div>

                  <h3>
                    {item.resumeName}
                  </h3>

                  <p>
                    Version: {item.version}
                  </p>

                  <p>
                    File: {item.fileName}
                  </p>

                  <p>
                    Size: {(item.fileSize / 1024).toFixed(2)} KB
                  </p>

                </div>

              </div>


              <div className="resume-right">

                {item.isCurrent && (
                  <span className="current-resume">
                    ⭐ Current Resume
                  </span>
                )}

                <div className="resume-actions">

                  {!item.isCurrent && (
                    <button
                      className="resume-current-btn"
                      onClick={() =>
                        handleMakeCurrent(item.id)
                      }
                    >
                      Make Current
                    </button>
                  )}

                  <button
                    className="resume-delete-btn"
                    onClick={() =>
                      handleDelete(item.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  </div>
);

}

export default ResumeManager;