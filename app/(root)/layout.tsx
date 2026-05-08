import { ReactNode } from "react";
import { isAuthenticated } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
const RootLayout = async ({ children }: { children: ReactNode }) => {
  // ==========================================
  // GLOBAL LAYOUT SECURITY GUARD
  // ==========================================
  // This verifies the secure Server Session Cookie. If the user is unauthenticated,
  // this layout instantly deflects them back to the login screen, protecting ALL child UI.
  const isUserAuthenticated = await isAuthenticated();
  
  if (!isUserAuthenticated) {
    redirect('/sign-in');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {children}
    </div>
  );
};

export default RootLayout;
