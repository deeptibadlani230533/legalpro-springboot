import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";

export default function EditCase() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cases/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to load case.");
          return;
        }

        setFormData(data);
      } catch (err) {
        setError("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cases/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Update failed.");
        return;
      }

      navigate(`/cases/${id}`);

    } catch (err) {
      setError("Unable to connect to server.");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Edit Case" />

      <main className="flex-1 bg-gray-100 p-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow">
          <form onSubmit={handleUpdate} className="space-y-4">

            <input
              name="caseTitle"
              value={formData.caseTitle}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />

            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />

            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded"
              >
                Update Case
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}