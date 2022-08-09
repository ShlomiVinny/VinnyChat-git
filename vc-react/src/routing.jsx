import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './components/Home/Home';
import Login from './components/Login/Login';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Login />} />
                <Route path='/Home' element={<HomePage />} />
                <Route path='/Login' element={<Login />} />

            </Routes>
        </BrowserRouter>
    )
};