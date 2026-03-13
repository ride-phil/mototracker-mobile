import React, { createContext, useContext, useState } from 'react';

interface DrawerContextValue {
  openDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({ openDrawer: () => {} });

export function useDrawer() {
  return useContext(DrawerContext);
}

export function DrawerProvider({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) {
  return (
    <DrawerContext.Provider value={{ openDrawer: onOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}
