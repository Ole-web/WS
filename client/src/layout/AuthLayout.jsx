import { Outlet } from "react-router-dom";
import "../styles/auth.scss";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Outlet />
      </div>
    </div>
  );
}
