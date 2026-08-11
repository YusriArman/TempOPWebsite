import React from "react";
import { Mail } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="flex justify-center items-center p-8 gap-2 bg-slate-600 relative z-10">
      <Mail className="mr-2 w-8 sm:w-4" />
      <p className="font-alata">
        Please contact{" "}
        <a
          href="mailto:op2026@gmail.com"
          className="hover:text-slate-400 text-slate-300"
        >
          op2026@gmail.com
        </a>{" "}
        if there is any discrepancy.
      </p>
    </footer>
  );
};

export default Footer;
