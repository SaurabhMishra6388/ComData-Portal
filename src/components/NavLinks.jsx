// src/components/NavLinks.jsx

import React from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button"; // Assuming you have a buttonVariants utility

/**
 * Renders a list of navigation links.
 * * @param {object} props
 * @param {Array<object>} props.navigation - Array of navigation objects ({ name, href, icon: IconComponent })
 * @param {object} props.location - The current location object from react-router-dom
 */
const NavLinks = ({ navigation, location }) => {
  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <Link
            key={item.name}
            to={item.href}
            className={
              // Using buttonVariants for styling consistency, assuming it provides base styles
              `${buttonVariants({ variant: "ghost", size: "lg" })}
              w-full justify-start gap-3 
              text-base font-medium transition-colors
              ${isActive 
                ? "bg-slate-700 text-white hover:bg-slate-700/80" 
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );
};

export default NavLinks;