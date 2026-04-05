import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-100 p-4">
      {children}
    </div>
  );
};

export default AuthLayout;
