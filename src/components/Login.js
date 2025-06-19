import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../utils/firebaseConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", email));
      if (!userDoc.exists()) {
        throw new Error("المستخدم غير موجود");
      }

      const userData = userDoc.data();
      if (!userData.Active) {
        throw new Error("الحساب غير مفعل");
      }
      if (userData.Role !== "مدير نظام") {
        throw new Error("ليس لديك صلاحية الدخول");
      }
      if (userData.Password !== password) {
        throw new Error("كلمة المرور غير صحيحة");
      }

      // Store display name in localStorage
      localStorage.setItem("displayName", userData.DisplayName);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md fade-in">
        <h2 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-label="البريد الإلكتروني"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-label="كلمة المرور"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin h-5 w-5 border-4 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
