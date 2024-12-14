import React from 'react';

const NavBar = () => {
    return (
        <nav className="bg-gray-800 p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">Fee's Chat</h1>
                <ul className="flex space-x-4">
                    <li>
                        <a href="/" className="text-gray-300 hover:text-white transition duration-300">
                            Home
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default NavBar;
