import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RekapNilai = () => {
    const { id: assignmentId } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(null); // State untuk melacak laporan siswa mana yang sedang dibuat

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

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();

            // Judul Dokumen
            doc.setFontSize(18);
            doc.text('Rekapitulasi Nilai', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Kelas: ${assignment?.class?.name || ''}`, 14, 30);
            doc.text(`Mata Pelajaran: ${assignment?.subject?.name || ''}`, 14, 36);

            // Definisikan kolom dan baris untuk tabel
            const tableColumn = ["No", "NIS", "Nama Siswa", "Nilai Rata-rata", "Status"];
            const tableRows = [];

            studentSummaries.forEach((item, index) => {
                const isPassing = item.averageScore >= assignment.kkm;
                const status = isPassing ? 'Tuntas' : 'Belum Tuntas';
                const score = item.averageScore !== null ? item.averageScore.toFixed(2) : 'N/A';

                const rowData = [index + 1, item.nis, item.fullName, score, status];
                tableRows.push(rowData);
            });

            // Buat tabel menggunakan autoTable dengan sintaks yang lebih modern dan stabil
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
            });
            doc.save(`rekap_nilai_${assignment?.class?.name}_${assignment?.subject?.name}.pdf`);
        } catch (err) {
            console.error("Gagal membuat PDF:", err);
            toast.error("Terjadi kesalahan saat membuat file PDF.");
        }
    };

    const handleExportStudentReport = async (student) => {
        setIsGenerating(student.studentId); // Atur status loading untuk siswa ini
        try {
            // 1. Panggil endpoint backend baru untuk mendapatkan detail nilai siswa
            const response = await api.get(`/teacher/assignments/${assignmentId}/students/${student.studentId}/report`);
            const reportData = response.data;

            // 2. Buat dokumen PDF
            const doc = new jsPDF();

            // Header
            doc.setFontSize(16);
            doc.text('Laporan Hasil Belajar Siswa', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

            // Informasi Siswa
            doc.setFontSize(11);
            doc.text(`Nama Siswa : ${reportData.student.fullName}`, 14, 35);
            doc.text(`NIS          : ${reportData.student.nis}`, 14, 42);
            doc.text(`Kelas        : ${reportData.assignment.className}`, 14, 49);

            // Membuat deskripsi Capaian Kompetensi otomatis (sebagai placeholder)
            let capaianKompetensi = `Siswa menunjukkan penguasaan yang baik pada sebagian besar materi ${reportData.assignment.subjectName}.`;
            if (reportData.summary.isPassing) {
                if (reportData.summary.averageScore > 85) {
                    capaianKompetensi = `Siswa menunjukkan penguasaan yang sangat baik dan konsisten pada seluruh materi ${reportData.assignment.subjectName}, mampu menerapkan konsep dalam berbagai situasi.`;
                } else {
                    capaianKompetensi = `Siswa telah mencapai ketuntasan belajar dan menunjukkan pemahaman yang baik pada materi ${reportData.assignment.subjectName}.`;
                }
            } else {
                capaianKompetensi = `Siswa masih memerlukan bimbingan dan latihan lebih lanjut pada beberapa materi ${reportData.assignment.subjectName} untuk dapat mencapai ketuntasan belajar.`;
            }

            const tableBody = [
                // Kelompok Mata Pelajaran (contoh)
                [{ content: 'A. Mata Pelajaran Umum', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
                [
                    '1', // Nomor
                    reportData.assignment.subjectName, // Intrakurikuler
                    reportData.summary.averageScore.toFixed(2), // Nilai Akhir
                    capaianKompetensi // Capaian Kompetensi
                ]
            ];

            autoTable(doc, {
                startY: 60,
                head: [['No', 'Intrakurikuler', 'Nilai Akhir', 'Capaian Kompetensi']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133], textColor: 255 },
                didParseCell: function (data) {
                    // Mengatur agar deskripsi capaian kompetensi bisa wrap text
                    if (data.column.dataKey === 3) { // Indeks kolom 'Capaian Kompetensi'
                        data.cell.styles.cellWidth = 'auto';
                    }
                }
            });

            doc.save(`rapot_${reportData.student.fullName.replace(/\s/g, '_')}_${reportData.assignment.subjectName}.pdf`);
        } catch (err) {
            console.error("Gagal membuat Laporan Siswa:", err);
            toast.error(`Gagal membuat laporan untuk ${student.fullName}: ${err.response?.data?.message || 'Server Error'}`);
        } finally {
            setIsGenerating(null); // Reset status loading
        }
    };

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

                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 text-sm text-white bg-green-600 rounded-md shadow hover:bg-green-700"
                    >
                        Ekspor ke PDF
                    </button>
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
                                <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Aksi</th>
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
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <button
                                                onClick={() => handleExportStudentReport(item)}
                                                disabled={isGenerating === item.studentId}
                                                className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:bg-gray-300 disabled:cursor-wait"
                                            >
                                                {isGenerating === item.studentId ? 'Membuat...' : 'Cetak Rapot'}
                                            </button>
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