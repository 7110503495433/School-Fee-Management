const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, "students.json");
app.use(cors());
app.use(express.json());
// Create the data file automatically on first run.
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}
function readStudents() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), "utf8");
}
// Test endpoint
app.get("/", (req, res) => {
  res.json({ message: "School Fee Management API is running" });
});
// Get all students
app.get("/api/students", (req, res) => {
  const students = readStudents();
  res.json(students);
});
// Add a student
app.post("/api/students", (req, res) => {
  const { name, rollNo, className, feeAmount } = req.body;
  if (!name || !rollNo || !className || feeAmount === undefined) {
    return res.status(400).json({
      message: "Name, roll number, class and fee amount are required"
    });
  }
  const students = readStudents();
  const duplicate = students.find(
    student => student.rollNo.toLowerCase() === String(rollNo).toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ message: "This roll number already exists" });
  }

  const newStudent = {
    id: Date.now().toString(),
    name: String(name).trim(),
    rollNo: String(rollNo).trim(),
    className: String(className).trim(),
    feeAmount: Number(feeAmount),
    feeStatus: "Unpaid",
    createdAt: new Date().toISOString()
  };
  if (!Number.isFinite(newStudent.feeAmount) || newStudent.feeAmount < 0) {
    return res.status(400).json({ message: "Fee amount must be a valid number" });
  }
  students.push(newStudent);
  saveStudents(students);
  res.status(201).json(newStudent);
});
// Update fee status: Paid or Unpaid
app.patch("/api/students/:id/fee", (req, res) => {
  const { feeStatus } = req.body;
  if (!["Paid", "Unpaid"].includes(feeStatus)) {
    return res.status(400).json({ message: "Status must be Paid or Unpaid" });
  }
  const students = readStudents();
  const index = students.findIndex(student => student.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Student not found" });
  }
  students[index].feeStatus = feeStatus;
  students[index].updatedAt = new Date().toISOString();
  saveStudents(students);
  res.json(students[index]);
});
// Delete a student
app.delete("/api/students/:id", (req, res) => {
  const students = readStudents();
  const filtered = students.filter(student => student.id !== req.params.id);
  if (filtered.length === students.length) {
    return res.status(404).json({ message: "Student not found" });
  }
  saveStudents(filtered);
  res.json({ message: "Student deleted successfully" });
});
// Summary for dashboard
app.get("/api/summary", (req, res) => {
  const students = readStudents();
  const paid = students.filter(s => s.feeStatus === "Paid");
  const unpaid = students.filter(s => s.feeStatus === "Unpaid");
  res.json({
    totalStudents: students.length,
    paidStudents: paid.length,
    unpaidStudents: unpaid.length,
    collectedAmount: paid.reduce((sum, s) => sum + s.feeAmount, 0),
    pendingAmount: unpaid.reduce((sum, s) => sum + s.feeAmount, 0)
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`School Fee API running at http://localhost:${PORT}`);
});
