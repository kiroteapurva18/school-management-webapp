import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student"
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const result = await register(form);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold">Register</h2>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full rounded border p-2" />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full rounded border p-2" />
        <select name="role" value={form.role} onChange={handleChange} className="w-full rounded border p-2">
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
        <button disabled={loading} className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700">
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link to="/login" className="text-blue-600">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
