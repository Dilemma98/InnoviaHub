import Header from "../../components/header/header";
import Navbar from "../../components/navbar/navbar";
import "../../pages/startPage/startPage.css";
import Sidebar from "../../components/Admin/Sidebar/sidebar";
import "./adminPage.css";
import { Outlet } from "react-router-dom";

const adminPage = () => {
  return (
    <div className="adminPage">
      <div className="headerAndNav">
        <Header />
        <Navbar />
      </div>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-content">
        <Outlet />
        </div>
      </div>
    </div>
  );
};

export default adminPage;
