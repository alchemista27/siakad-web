import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

const RekapNilai = () => {
    const { id: assignmentId } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSummary = useCallback(async () => {
        try {
            // Endpoint ini perlu Anda buat di backend
            const response = await api.get(`/teacher/assignments/${assignmentId}/summary`);
            setSummary(response.data);
        } catch (err) {
            setError('Gagal mengambil data rekapitulasi nilai.');
            toast.error(`Gagal mengambil data: ${err.response?.data?.message || 'Server Error'}`);
            if (err.response?.status === 401) {
                localStorage.clear();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    }, [assignmentId, navigate]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    if (loading) return <div className="p-8">Memuat data rekapitulasi...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!summary) return <div className="p-8">Data rekapitulasi tidak ditemukan.</div>;

    const { assignment, studentSummaries } = summary;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="p-6 bg-white rounded-lg shadow">
                <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Rekapitulasi Nilai</h1>
                <div className="flex space-x-4 text-gray-600">
                    <span>Kelas: <strong>{assignment?.class?.name || '...'}</strong></span>
                    <span>Mata Pelajaran: <strong>{assignment?.subject?.name || '...'}</strong></span>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">No</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">NIS</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nama Siswa</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nilai Rata-rata</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentSummaries.map((item, index) => {
                                const isPassing = item.averageScore >= assignment.kkm;
                                return (
                                    <tr key={item.studentId} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap">{index + 1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{item.nis}</td>
                                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{item.fullName}</td>
                                        <td className="px-4 py-2 font-semibold whitespace-nowrap">
                                            {item.averageScore !== null ? item.averageScore.toFixed(2) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                isPassing 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                                {isPassing ? 'Tuntas' : 'Belum Tuntas'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RekapNilai;