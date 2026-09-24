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
    <div>
      <h1>Company Tracker</h1>

      <p>
        Track your placement applications and interviews.
      </p>

      <form onSubmit={handleAddCompany}>

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

        <button type="submit">
          Add Company
        </button>

      </form>

      <hr />
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
      <h3>My Companies</h3>

      <p>
        {companies.length} companies
      </p>

      {companies
  .filter(
    (item) =>
      filterStatus === "All" ||
      item.status === filterStatus
  )
  .map((item) => (
  <div key={item.id}>
    <h4>{item.company}</h4>

    <p>
      Status: {item.status}
    </p>

    <button onClick={() => handleEdit(item)}>
      Edit
    </button>

    <button onClick={() => handleDelete(item.id)}>
      Delete
    </button>

    <hr />
  </div>
))}

    </div>
  );
}

export default CompanyTracker;