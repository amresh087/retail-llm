import React, { createContext, useState } from "react";

type SidebarContextType = {
  show: boolean;
  setShow: (v: boolean) => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  show: false,
  setShow: () => {}
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  return (
    <SidebarContext.Provider value={{ show, setShow }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarProvider;
