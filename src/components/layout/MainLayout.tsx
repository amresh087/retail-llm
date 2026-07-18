import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light" style={{ gap: 0 }}>
      <Navbar />
      <main className="flex-grow-1" style={{ padding: 0 }}>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
