import React from 'react';
import NavBar from './components/NavBar';
import ChatInterface from './components/ChatInterface';

const App = () => {
    return (
        <div>
            <NavBar />
            <div className="p-4">
                <h1 className="text-center text-2xl font-bold">Welcome to Fee's Chat</h1>
                <ChatInterface />
            </div>
        </div>
    );
};

export default App;
