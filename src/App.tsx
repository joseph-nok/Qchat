import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './route/LandingPage';
import Login from './route/Login';
import Register from './route/Register';
import ForgotPassword from './route/ForgotPassword';
import MessagesList from './route/MessagesList';
import Explore from './route/Explore';
import VerifyProfile from './route/VerifyProfile';
import EditProfile from './route/EditProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/verify-profile" element={<VerifyProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
