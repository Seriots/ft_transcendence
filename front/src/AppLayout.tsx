import React from 'react';
import Navbar from './Components/Navbar/Navbar';
import './AppLayout.css';


interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => /** React.FC<AppLayoutProps> type is used to explicitly specify the prop types for the component, that can accept the prop types as a type parameter*/
{
	return (
    <div className="app-layout">
      <Navbar />
      <div className="app-content">{children}</div>
    </div>
  );
};

export default AppLayout;
