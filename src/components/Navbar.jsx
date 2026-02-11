import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-x1 font-bold">
                    Finance Tracker</Link>

                <div>
                    <Link to="/login" className="mr-4 hover:underline">Login</Link>
                    <Link to="/register" className="hover:underline">Register</Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;