import React from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">لوحة التحكم</h1>
      <p className="text-center">مرحبا، {localStorage.getItem("displayName")}!</p>
      {/* Dashboard content will be added here */}
    </div>
  );
};

export default Dashboard;
