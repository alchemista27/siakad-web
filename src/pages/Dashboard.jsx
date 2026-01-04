import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }, [navigate]);

    const fetchClasses = useCallback(async () => {
        try {
            // pakai API untuk fetch data kelas sesuai role user
            const response = await api.get('/teacher/my-classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Gagal ambil data kelas:', error);
            // Jika token tidak valid (401), otomatis logout
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [handleLogout]);

    useEffect (() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            fetchClasses();
        } else {
            navigate('/');
        }
    }, [navigate, fetchClasses]);

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
                            <span className="mr-4 text-gray-700">Halo, {user?.fullName}</span>
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
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Daftar Kelas Ajar
                        </h2>
                        {loading ? (
                            <p>Memuat data...</p>
                        ) : classes.length === 0 ? (
                            <div className="p-6 bg-white rounded shadow">
                                <p className="text-gray-500">
                                    Anda belum memiliki kelas ajar
                                </p>
                            </div>
                ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((item) => (
                    <div key={item.id} className="overflow-hidden transition-shadow bg-white rounded-lg shadow hover:shadow-lg ">
                        <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                                        {item.class.level} SD
                                    </span>
                                </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {item.class.name}
                            </h3>
                            <p className="mt-1 text-gray-600">
                                {item.subject.name}
                            </p>
                            <p className="mt-4 text-sm text-gray-500">
                                  KKM: {item.kkm}
                            </p>
                            <button 
                            className="w-full px-4 py-2 mt-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                            onClick={() => navigate(`/kelas/${item.id}/nilai`)}>
                                Input Nilai
                            </button>
                        </div>
                    </div>
                    ))}
                    </div>
                    )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;