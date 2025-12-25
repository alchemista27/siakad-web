import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect (() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className = 'min-h-screen bg-gray-50'>
            {/* Navbar Sederhana Dulu */}
            <nav className='bg-white shadow'>
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-blue-600">
                                SIAKAD SD FIKTIF
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-grey-700">Halo, {user?.fullName}</span>
                            <button 
                            onClick={handleLogout}
                            className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Isi Dashboard */}
            <main className="py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="px-4 py-8 sm:px-0">
                    <div className="p-6 bg-white rounded-lg shadow h-96">
                        <h2 className="text-2xl font-semibold text-grey-800">
                            Selamat datang di Dashboard SIAKAD SD FIKTIF {user?.role}
                        </h2>
                        <p className="mt-4 text-grey-600">
                            Menu navigasi akan muncul sesuai dengan hak akses Anda.
                        </p>
                        {/* Nanti kita load data dan nilai siswa disini */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;