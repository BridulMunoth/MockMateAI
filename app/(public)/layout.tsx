import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

const PublicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {children}
    </div>
  );
};

export default PublicLayout;
