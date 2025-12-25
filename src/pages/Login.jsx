import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });

            // Simpan token di localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Redirect ke halaman dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat Login.');
        }
    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-100'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold text-center text-grey-900'>
                    SIAKAD Login
                </h2>
                {error && (
                    <div className='p-3 text-sm text-red-700 bg-red-100 rounded'>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-grey-700'>
                            Username
                        </label>
                        <input type="text"
                        className='w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                        required
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-grey-700'>
                            Password
                        </label>
                        <input 
                         type="password"
                         className = "w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                         value = {password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                         />
                    </div>
                    <button
                        type='submit'
                        className='w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700'
                        >Masuk</button>
                </form>
            </div>
        </div>
    );
};

export default Login;