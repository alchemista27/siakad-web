import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

const InputNilai = () => {
    const { id: assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // State untuk menampung perubahan nilai: { 'studentId-assessmentId': score }
    const [grades, setGrades] = useState({});
    // State untuk menyimpan nilai awal, untuk mendeteksi perubahan
    const [initialGrades, setInitialGrades] = useState({});

    // State untuk form penilaian baru
    const [newAssessmentName, setNewAssessmentName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    const fetchDetails = useCallback(async () => {
        try {
            const response = await api.get(`/teacher/assignments/${assignmentId}`);
            setAssignment(response.data);

            // Inisialisasi state 'grades' dengan nilai yang sudah ada dari database
            const fetchedGrades = {};
            response.data.assessments.forEach(assessment => {
                assessment.grades.forEach(grade => {
                    // Gunakan null untuk nilai kosong agar konsisten
                    fetchedGrades[`${grade.studentId}-${assessment.id}`] = grade.score ?? null;
                });
            });
            setGrades(fetchedGrades);
            setInitialGrades(fetchedGrades);

        } catch (err) {
            setError('Gagal mengambil data detail kelas.');
            if (err.response?.status === 401) {
                // Handle token expired
                localStorage.clear();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    }, [assignmentId, navigate]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleGradeChange = (studentId, assessmentId, value) => {
        // Jika input dikosongkan, simpan sebagai string kosong agar field bisa dihapus
        if (value === '') {
            setGrades(prev => ({ ...prev, [`${studentId}-${assessmentId}`]: '' }));
            return;
        }

        const score = parseFloat(value);

        // Cegah NaN masuk ke dalam state. Ini adalah penyebab utama nilai hilang dari input.
        // Jika hasil parse bukan angka (misal: pengguna mengetik huruf), jangan update state.
        if (isNaN(score)) {
            return;
        }

        // Batasi nilai (clamp) antara 0 dan 100 menggunakan Math.max dan Math.min
        const clampedScore = Math.max(0, Math.min(score, 100));

        setGrades(prev => ({
            ...prev,
            [`${studentId}-${assessmentId}`]: clampedScore
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Bandingkan 'grades' dengan 'initialGrades' dan kirim perubahannya saja.
            const changedGrades = Object.keys(grades).reduce((acc, key) => {
                const currentScore = grades[key];
                const initialScore = initialGrades[key];

                // Normalisasi nilai untuk perbandingan: null, undefined, dan '' dianggap sama (kosong).
                const normalizedCurrent = currentScore === '' || currentScore === null ? null : parseFloat(currentScore);
                const normalizedInitial = initialScore === null || initialScore === undefined ? null : parseFloat(initialScore);

                // Jika nilainya berbeda, tambahkan ke payload
                if (normalizedCurrent !== normalizedInitial) {
                    const [studentId, assessmentId] = key.split('-');
                    acc.push({
                        studentId: parseInt(studentId, 10),
                        assessmentId: parseInt(assessmentId, 10),
                        score: normalizedCurrent,
                    });
                }
                return acc;
            }, []);


            if (changedGrades.length === 0) {
                toast.info('Tidak ada perubahan untuk disimpan.');
                return;
            }

            // Ganti '/teacher/grades/bulk-update' dengan endpoint backend Anda yang sebenarnya
            await api.put('/teacher/grades/bulk-update', { grades: changedGrades });

            toast.success('Perubahan berhasil disimpan!');
            // Setelah berhasil, update state awal agar sesuai dengan state saat ini
            setInitialGrades(grades);

        } catch (err) {
            // Tampilkan error yang lebih detail di console untuk debugging
            console.error("Gagal menyimpan perubahan:", err.response?.data || err.message);
            toast.error(`Gagal menyimpan perubahan: ${err.response?.data?.message || 'Server Error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        if (!newAssessmentName.trim()) {
            toast.warn('Nama penilaian tidak boleh kosong.');
            return;
        }
        setIsCreating(true);
        try {
            await api.post('/teacher/assessments', {
                teachingAssignmentId: assignmentId,
                name: newAssessmentName,
            });
            setNewAssessmentName(''); // Reset form
            await fetchDetails(); // Ambil data terbaru untuk menampilkan kolom baru
        } catch (err) {
            console.error("Gagal membuat penilaian:", err.response?.data || err.message);
            toast.error(`Gagal membuat penilaian: ${err.response?.data?.message || 'Server Error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAssessment = async (assessmentId, assessmentName) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus penilaian "${assessmentName}"? Semua nilai yang terkait akan ikut terhapus.`)) {
            return;
        }
    
        try {
            // Sesuaikan endpoint dengan backend Anda, contoh: /teacher/assessments/:id
            await api.delete(`/teacher/assessments/${assessmentId}`);
            toast.success(`Penilaian "${assessmentName}" berhasil dihapus.`);
            await fetchDetails(); // Refresh data untuk memperbarui UI
        } catch (err) {
            console.error('Error deleting assessment:', err.response?.data || err.message);
            toast.error(`Gagal menghapus penilaian: ${err.response?.data?.message || 'Server Error'}`);
        }
    };

    // Memoize pengecekan perubahan untuk efisiensi dan menonaktifkan tombol simpan
    const hasChanges = useMemo(() => {
        const gradeKeys = Object.keys(grades);
        const initialGradeKeys = Object.keys(initialGrades);

        // Jika jumlah key berbeda, berarti ada perubahan (seharusnya tidak terjadi, tapi sebagai pengaman)
        if (gradeKeys.length !== initialGradeKeys.length) return true;

        for (const key of gradeKeys) {
            const currentScore = grades[key];
            const initialScore = initialGrades[key];

            const normalizedCurrent = currentScore === '' || currentScore === null ? null : parseFloat(currentScore);
            const normalizedInitial = initialScore === null || initialScore === undefined ? null : parseFloat(initialScore);

            if (normalizedCurrent !== normalizedInitial) {
                return true; // Ditemukan perubahan
            }
        }

        return false; // Tidak ada perubahan
    }, [grades, initialGrades]);

    if (loading) return <div className="p-8">Memuat data kelas...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!assignment) return <div className="p-8">Data tidak ditemukan.</div>;

    // Gunakan optional chaining untuk mencegah crash jika relasi data (class) tidak ada
    const students = assignment?.class?.students || [];
    const assessments = assignment?.assessments || [];

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="p-6 bg-white rounded-lg shadow">
                <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Input Nilai</h1>
                <div className="flex space-x-4 text-gray-600">
                    <span>Kelas: <strong>{assignment?.class?.name || 'Memuat...'}</strong></span>
                    <span>Mata Pelajaran: <strong>{assignment?.subject?.name || 'Memuat...'}</strong></span>
                </div>

                {/* Form Tambah Penilaian */}
                <div className="p-4 my-6 border rounded-md bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Buat Penilaian Baru</h3>
                    <form onSubmit={handleCreateAssessment} className="flex items-end mt-2 space-x-2">
                        <div className="flex-grow">
                            <label htmlFor="assessment-name" className="text-sm text-gray-600">Nama Penilaian (Contoh: UH 1, UTS)</label>
                            <input
                                id="assessment-name"
                                type="text"
                                value={newAssessmentName}
                                onChange={(e) => setNewAssessmentName(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border rounded"
                                placeholder="Ulangan Harian 1"
                                required
                            />
                        </div>
                        <button type="submit" disabled={isCreating} className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isCreating ? 'Menyimpan...' : 'Tambah'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">No</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">NIS</th>
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nama Siswa</th>
                                {assessments.map(assessment => (
                                    <th key={assessment.id} className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                        <div className="flex items-center justify-between">
                                            <span>{assessment.name}</span>
                                            <button
                                                onClick={() => handleDeleteAssessment(assessment.id, assessment.name)}
                                                className="p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600"
                                                title={`Hapus penilaian ${assessment.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                {assessments.length === 0 && (
                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nilai</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((studentClass, index) => {
                                const student = studentClass?.student;
                                // Safety check: Jika data siswa tidak ada karena inkonsistensi, lewati baris ini.
                                if (!student) return null;
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap">{index + 1}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{student.nis}</td>
                                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{student.fullName}</td>
                                        {assessments.map(assessment => {
                                            const gradeKey = `${student.id}-${assessment.id}`;
                                            return (
                                                <td key={assessment.id} className="px-4 py-2 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-20 p-1 text-center border rounded"
                                                        value={grades[gradeKey] ?? ''}
                                                        onChange={(e) => handleGradeChange(student.id, assessment.id, e.target.value)}
                                                    />
                                                </td>
                                            );
                                        })}
                                        {assessments.length === 0 && (
                                            <td className="px-4 py-2 text-sm text-gray-400 whitespace-nowrap">
                                                Buat penilaian terlebih dahulu
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving || !hasChanges}
                        className="px-6 py-2 text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputNilai;