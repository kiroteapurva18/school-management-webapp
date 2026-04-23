require("dotenv").config();
const mongoose = require("mongoose");

// Import your EXISTING models
const User = require("./models/User");
const Student = require("./models/Student");
const Teacher = require("./models/Teacher");
const Attendance = require("./models/Attendance");
const Assignment = require("./models/Assignment");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to DB");

    // Clear old data (optional but recommended)
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Attendance.deleteMany();
    await Assignment.deleteMany();

    // USERS
    await User.insertMany([
      { role: "admin", email: "admin@school.com", password: "123456" },
      { role: "teacher", email: "teacher1@school.com", password: "123456" },
      { role: "student", email: "student1@school.com", password: "123456" },
      { role: "parent", email: "parent1@school.com", password: "123456" },
    ]);

    // STUDENTS
    await Student.insertMany([
      { name: "Rahul Sharma", class: "10A", rollNumber: 1, email: "rahul@student.com" },
      { name: "Priya Singh", class: "10A", rollNumber: 2, email: "priya@student.com" },
    ]);

    // TEACHERS
    await Teacher.insertMany([
      { name: "Mr. Verma", subject: "Mathematics", email: "verma@school.com" },
      { name: "Ms. Iyer", subject: "Science", email: "iyer@school.com" },
    ]);

    // ATTENDANCE
    await Attendance.insertMany([
      { studentId: "STUDENT_ID_1", date: "2026-04-15", status: "Present" },
      { studentId: "STUDENT_ID_2", date: "2026-04-15", status: "Absent" },
    ]);

    // ASSIGNMENTS (Homework)
    await Assignment.insertMany([
      { title: "Math Homework", description: "Solve chapter 5 problems", dueDate: "2026-04-20" },
      { title: "Science Project", description: "Prepare model on solar system", dueDate: "2026-04-25" },
    ]);

    console.log("Data Inserted Successfully ✅");
    process.exit();
  })
  .catch(err => console.log(err));