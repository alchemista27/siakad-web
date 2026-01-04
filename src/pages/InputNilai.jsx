import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const InputNilai = () => {
    const { id: assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // State untuk menampung perubahan nilai: { 'studentId-assessmentId': score }
    const [grades, setGrades] = useState({});

    // State untuk form penilaian baru
    const [newAssessmentName, setNewAssessmentName] = useState('');
    const [isCreating, setIsCreating] = useState(false);


    const fetchDetails = useCallback(async () => {
        try {
            const response = await api.get(`/teacher/assignments/${assignmentId}`);
            setAssignment(response.data);

            // Inisialisasi state 'grades' dengan nilai yang sudah ada dari database
            const initialGrades = {};
            response.data.assessments.forEach(assessment => {
                assessment.grades.forEach(grade => {
                    initialGrades[`${grade.studentId}-${assessment.id}`] = grade.score;
                });
            });
            setGrades(initialGrades);

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
        const score = value === '' ? '' : parseFloat(value);
        // Batasi nilai antara 0 dan 100
        if (score > 100) return;

        setGrades(prev => ({
            ...prev,
            [`${studentId}-${assessmentId}`]: score
        }));
    };

    const handleSaveChanges = async () => {
        alert('Fitur "Simpan Perubahan" akan diimplementasikan selanjutnya!\nData di console log.');
        console.log('Data nilai yang akan disimpan:', grades);
        // TODO: Buat endpoint POST/PUT di backend untuk menyimpan data 'grades'
    };

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        if (!newAssessmentName.trim()) {
            alert('Nama penilaian tidak boleh kosong.');
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
            alert('Gagal membuat penilaian baru.');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="p-8">Memuat data kelas...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!assignment) return <div className="p-8">Data tidak ditemukan.</div>;

    const { students } = assignment.class;
    const { assessments } = assignment;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="p-6 bg-white rounded-lg shadow">
                <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-blue-600 hover:underline">
                    &larr; Kembali ke Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Input Nilai</h1>
                <div className="flex space-x-4 text-gray-600">
                    <span>Kelas: <strong>{assignment.class.name}</strong></span>
                    <span>Mata Pelajaran: <strong>{assignment.subject.name}</strong></span>
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
                                        {assessment.name}
                                    </th>
                                ))}
                                {assessments.length === 0 && (
                                    <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nilai</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((studentClass, index) => {
                                const student = studentClass.student;
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
                        className="px-6 py-2 text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputNilai;