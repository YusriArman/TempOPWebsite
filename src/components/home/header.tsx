import React from "react";
import title from "../../assets/2_Celestial title with pink glow.png";
import planet from "../../assets/2_bellevue planet.png";
import { Link, useLocation } from "react-router-dom";
import { CircleHelp, Ticket } from "lucide-react";

const HomeHeader: React.FC = () => {
  const location = useLocation();
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center font-zendots text-xl mx-4 sm:mx-8 border-b p-6">
        <div className="flex items-center space-x-4">
          <img src={planet} className="hidden sm:block sm:h-32" />
          <div className="flex flex-col items-center sm:items-start">
            <img src={title} className="w-1/2 md:w-1/3 lg:w-1/5" />
            <h1 className="lg:pl-3 text-xl text-center sm:text-left">
              Orientation Party 2026
            </h1>
          </div>
        </div>
        <div className="text-right flex items-baseline pt-4 sm:pt-0 text-sm sm:text-2xl">
          {location.pathname === "/faq" ? (
            <Link to="/">
              <p className="whitespace-nowrap flex items-center hover:bg-celestialSecondary px-2 py-1 rounded"><Ticket className="mr-2 w-6"/>Ticket Queuing</p>
            </Link>
          ) : (
            <Link to="/faq">
              <p className="whitespace-nowrap flex items-center hover:bg-celestialSecondary px-2 py-1 rounded"><CircleHelp className="mr-2 w-6"/>FAQ</p>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default HomeHeader;
