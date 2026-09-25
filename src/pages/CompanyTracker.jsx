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
import "./CompanyTracker.css";

function CompanyTracker() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("Applied");
  const [filterStatus, setFilterStatus] = useState("All");

  const [companies, setCompanies] = useState([]);

  // Get companies from Firestore
  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    const q = query(
      collection(db, "companies"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companyList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setCompanies(companyList);
    });

    return () => unsubscribe();
  }, []);

  // Add company
  const handleAddCompany = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "companies"), {
        company: company,
        status: status,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      alert("Company added successfully!");

      setCompany("");
      setStatus("Applied");

    } catch (error) {
      console.log(error);
      alert("Failed to add company");
    }
  };
  // Delete company
const handleDelete = async (id) => {
  try {
    await deleteDoc(doc(db, "companies", id));

    alert("Company deleted successfully!");
  } catch (error) {
    console.log(error);
    alert("Failed to delete company");
  }
};

// Edit company
const handleEdit = async (item) => {
  const newCompany = prompt(
    "Enter company name:",
    item.company
  );

  const newStatus = prompt(
    "Enter status (Applied/OA/Interview/Selected/Rejected):",
    item.status
  );

  if (!newCompany || !newStatus) {
    return;
  }

  try {
    await updateDoc(doc(db, "companies", item.id), {
      company: newCompany,
      status: newStatus
    });

    alert("Company updated successfully!");
  } catch (error) {
    console.log(error);
    alert("Failed to update company");
  }
};

  return (
  <div className="company-page">

    <div className="company-header">
      <h1>Company Tracker</h1>

      <p>
        Track your placement applications and interviews.
      </p>
    </div>

    <div className="company-container">

      {/* Add Company */}
      <div className="company-card">

        <h2>Add Company</h2>

        <form
          className="company-form"
          onSubmit={handleAddCompany}
        >

          <input
            type="text"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Applied">Applied</option>
            <option value="OA">OA</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            className="company-add-btn"
            type="submit"
          >
            Add Company
          </button>

        </form>

      </div>

      {/* Filters */}
      <div className="company-card">

        <h2>Filter Companies</h2>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Applied">Applied</option>
          <option value="OA">OA</option>
          <option value="Interview">Interview</option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
        </select>

      </div>

      {/* Company List */}
      <div className="company-card">

        <h2>My Companies</h2>

        <p>
          {companies.length} companies
        </p>

        <div className="company-list">

          {companies
            .filter(
              (item) =>
                filterStatus === "All" ||
                item.status === filterStatus
            )
            .map((item) => (

              <div
                className="company-item"
                key={item.id}
              >

                <div className="company-info">

                  <h3>
                    {item.company}
                  </h3>

                  <p>
                    Status:
                  </p>

                  <span
                    className={`company-status ${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>

                </div>

                <div className="company-actions">

                  <button
                    className="company-edit-btn"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>

                  <button
                    className="company-delete-btn"
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

  </div>
);
}

export default CompanyTracker;