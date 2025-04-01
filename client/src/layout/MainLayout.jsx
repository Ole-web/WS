import { Outlet } from "react-router-dom";
import "../styles/main.scss";

export default function MainLayout() {
  return (
    <div className="main-layout">
      <header>wesynk.</header>
      <Outlet />
    </div>
  );
}
