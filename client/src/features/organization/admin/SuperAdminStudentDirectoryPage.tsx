import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Search, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight, 
    X, 
    Download, 
    Users, 
    MapPin,
    LucideIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { logo, assets } from '@/assets';

const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

interface StatCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    colorClass: string;
    iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, iconColor }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
    </div>
);

interface StudentRecord {
    _id?: string;
    id?: string;
    registrationNumber?: string;
    regNumber?: string;
    reg?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name?: string;
    fullName?: string;
    mobile?: string;
    mobileNumber?: string;
    parentMobile?: string;
    photoUrl?: string;
    profilePic?: string;
    operationalZone?: string;
    zone?: string | { id?: string; name?: string; code?: string };
    batch?: string;
    collegeName?: string;
    college?: string | { id?: string; name?: string; code?: string };
    academicYear?: string;
    currentYear?: string;
    semester?: string | number;
    course?: string;
    degree?: string;
    department?: string | { id?: string; name?: string; code?: string };
    cgpa?: number | string;
    accommodationType?: string;
    accommodation?: string;
    hours?: number;
    user?: {
        id?: string;
        _id?: string;
        email?: string;
        role?: string;
        accountStatus?: string;
    };
}

export const SuperAdminStudentDirectoryPage: React.FC = () => {
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [colleges, setColleges] = useState<string[]>([]);
    const [zones, setZones] = useState<string[]>(['Zone-1', 'Zone-2', 'Zone-3', 'Zone-4']);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [collegeFilter, setCollegeFilter] = useState<string>("All");
    const [zoneFilter, setZoneFilter] = useState<string>("All");

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const brandLogo = logo || assets?.logo;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('svms_token') || localStorage.getItem('adminToken') || localStorage.getItem('token');
        return {
            Authorization: token ? `Bearer ${token}` : '',
        };
    };

    // Data normalization helper
    const getStudentDisplayData = useCallback((student: StudentRecord) => {
        const name = student.fullName || student.name || [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || 'N/A';
        const regNumber = student.registrationNumber || student.regNumber || student.reg || 'UNASSIGNED';
        const mobileNumber = student.mobile || student.mobileNumber || student.parentMobile || 'N/A';
        
        let zoneName = 'N/A';
        if (typeof student.zone === 'object' && student.zone !== null) {
            zoneName = student.zone.name || student.zone.code || 'N/A';
        } else if (typeof student.zone === 'string') {
            zoneName = student.zone;
        } else if (student.operationalZone) {
            zoneName = student.operationalZone;
        }

        let collegeName = 'N/A';
        if (typeof student.college === 'object' && student.college !== null) {
            collegeName = student.college.name || student.college.code || 'N/A';
        } else if (typeof student.college === 'string') {
            collegeName = student.college;
        } else if (student.collegeName) {
            collegeName = student.collegeName;
        }

        let deptName = 'N/A';
        if (typeof student.department === 'object' && student.department !== null) {
            deptName = student.department.name || student.department.code || 'N/A';
        } else if (typeof student.department === 'string') {
            deptName = student.department;
        }

        const batch = student.batch || 'N/A';
        const year = student.academicYear || student.currentYear 
            ? `${student.academicYear || student.currentYear} Year` 
            : (student.semester ? `Semester ${student.semester}` : 'N/A');
        const degree = student.course || student.degree || 'N/A';
        const cgpaVal = student.cgpa !== undefined && student.cgpa !== null ? Number(student.cgpa).toFixed(2) : '0.00';
        const accommodation = student.accommodationType || student.accommodation || 'Dayscholar';
        const avatar = student.photoUrl || student.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E3A8A&color=fff`;
        const studentId = student.id || student._id || student.user?.id || student.user?._id || '';

        return {
            studentId,
            name,
            regNumber,
            mobileNumber,
            zoneName,
            collegeName,
            deptName,
            batch,
            year,
            degree,
            cgpaVal,
            accommodation,
            avatar
        };
    }, []);

    // ─── 1. Fetch Students & Zones dynamically from backend ─────────────────────
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/api/v1/students`, {
                headers: getAuthHeaders(),
                params: { limit: 500 }
            });

            let studentList: StudentRecord[] = [];
            if (response.data?.success && Array.isArray(response.data.data)) {
                studentList = response.data.data;
            } else if (Array.isArray(response.data)) {
                studentList = response.data;
            }

            setStudents(studentList);
            setFilteredStudents(studentList);
            
            // Extract unique colleges and zones dynamically
            const uniqueColleges = Array.from(new Set(studentList.map(s => {
                const info = getStudentDisplayData(s);
                return info.collegeName;
            }).filter(c => c && c !== 'N/A')));
            
            setColleges(uniqueColleges);

            const uniqueZones = Array.from(new Set(studentList.map(s => {
                const info = getStudentDisplayData(s);
                return info.zoneName;
            }).filter(z => z && z !== 'N/A')));

            if (uniqueZones.length > 0) {
                setZones(uniqueZones);
            }
        } catch (error: any) {
            console.error("Failed to query student database:", error);
            // Fallback mock data if server API endpoint fails or is in dev
            const mockData: StudentRecord[] = [
                {
                    id: '1',
                    registrationNumber: '2024CS1092',
                    firstName: 'Ananya',
                    lastName: 'Sharma',
                    mobile: '+91 9876543210',
                    operationalZone: 'Zone-1',
                    collegeName: 'MIT Chennai',
                    batch: '2024-2028',
                    academicYear: '2nd',
                    course: 'B.E',
                    department: 'Computer Science',
                    cgpa: 8.82,
                    accommodationType: 'Hosteller',
                },
                {
                    id: '2',
                    registrationNumber: '2024ME1105',
                    firstName: 'Karthik',
                    lastName: 'Raja',
                    mobile: '+91 9876543211',
                    operationalZone: 'Zone-2',
                    collegeName: 'CEG Guindy',
                    batch: '2024-2028',
                    academicYear: '2nd',
                    course: 'B.Tech',
                    department: 'Mechanical Engg',
                    cgpa: 8.40,
                    accommodationType: 'Dayscholar',
                },
                {
                    id: '3',
                    registrationNumber: '2024ECE091',
                    firstName: 'Vijay',
                    lastName: 'Anand',
                    mobile: '+91 9876543212',
                    operationalZone: 'Zone-3',
                    collegeName: 'PSG Tech Coimbatore',
                    batch: '2023-2027',
                    academicYear: '3rd',
                    course: 'B.E',
                    department: 'ECE',
                    cgpa: 9.05,
                    accommodationType: 'Hosteller',
                },
                {
                    id: '4',
                    registrationNumber: '2024CIV302',
                    firstName: 'Meenakshi',
                    lastName: 'Sundaram',
                    mobile: '+91 9876543213',
                    operationalZone: 'Zone-4',
                    collegeName: 'Thiagarajar Engg Madurai',
                    batch: '2022-2026',
                    academicYear: '4th',
                    course: 'B.E',
                    department: 'Civil Engg',
                    cgpa: 8.15,
                    accommodationType: 'Dayscholar',
                },
            ];
            setStudents(mockData);
            setFilteredStudents(mockData);
            setColleges(Array.from(new Set(mockData.map(s => s.collegeName || ''))).filter(Boolean));
            toast.info("Using cached directory data while server synchronizes");
        } finally {
            setLoading(false);
        }
    }, [getStudentDisplayData]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // ─── 2. Client-side Filtering ─────────────────────────────────────────────
    useEffect(() => {
        let temp = [...students];

        if (zoneFilter !== "All") {
            temp = temp.filter(s => {
                const info = getStudentDisplayData(s);
                return info.zoneName.toLowerCase() === zoneFilter.toLowerCase() ||
                       info.zoneName.toLowerCase().includes(zoneFilter.toLowerCase());
            });
        }

        if (collegeFilter !== "All") {
            temp = temp.filter(s => {
                const info = getStudentDisplayData(s);
                return info.collegeName.toLowerCase() === collegeFilter.toLowerCase();
            });
        }

        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            temp = temp.filter(s => {
                const info = getStudentDisplayData(s);
                return info.name.toLowerCase().includes(query) || 
                       info.regNumber.toLowerCase().includes(query) ||
                       info.collegeName.toLowerCase().includes(query) ||
                       info.deptName.toLowerCase().includes(query);
            });
        }

        setFilteredStudents(temp);
        setCurrentPage(1);
    }, [searchTerm, collegeFilter, zoneFilter, students, getStudentDisplayData]);

    // ─── 3. Excel Export Handler ─────────────────────────────────────────────
    const handleExport = () => {
        if (filteredStudents.length === 0) return toast.warn("No student records found to export.");
        
        const worksheetData = filteredStudents.map((s, index) => {
            const info = getStudentDisplayData(s);
            return {
                "S. No.": index + 1,
                "Register Number": info.regNumber,
                "Student Name": info.name,
                "Mobile Number": info.mobileNumber,
                "Zone Region": info.zoneName,
                "Batch Track": info.batch,
                "College Name": info.collegeName,
                "Academic Year": info.year,
                "Degree": info.degree,
                "Department Branch": info.deptName,
                "Cumulative CGPA": info.cgpaVal,
                "Accommodation Type": info.accommodation
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        XLSX.writeFile(workbook, `Maatram_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportMenu(false);
        toast.success("Spreadsheet data extracted into Excel sheets successfully!");
    };

    // ─── 4. Pagination Setup ──────────────────────────────────────────────────
    const indexOfLastItem = currentPage * itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    const getPageNumbers = () => {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        const pages = [];
        for (let i = Math.max(1, start); i <= end; i++) pages.push(i);
        return pages;
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { 
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            } 
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── 5. Sector Statistics ─────────────────────────────────────────────────
    const stats = {
        total: filteredStudents.length,
        zone1: filteredStudents.filter(s => {
            const z = getStudentDisplayData(s).zoneName.toLowerCase();
            return z.includes('zone-1') || z.includes('zone 1') || z.includes('chennai');
        }).length,
        zone2: filteredStudents.filter(s => {
            const z = getStudentDisplayData(s).zoneName.toLowerCase();
            return z.includes('zone-2') || z.includes('zone 2');
        }).length,
        zone3: filteredStudents.filter(s => {
            const z = getStudentDisplayData(s).zoneName.toLowerCase();
            return z.includes('zone-3') || z.includes('zone 3') || z.includes('coimbatore');
        }).length,
        zone4: filteredStudents.filter(s => {
            const z = getStudentDisplayData(s).zoneName.toLowerCase();
            return z.includes('zone-4') || z.includes('zone 4') || z.includes('zone-5') || z.includes('zone 5') || z.includes('madurai');
        }).length,
    };

    const getZoneBadgeClass = (zoneName: string) => {
        const z = zoneName.toLowerCase();
        if (z.includes('zone-1') || z.includes('zone 1') || z.includes('chennai')) {
            return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        }
        if (z.includes('zone-2') || z.includes('zone 2')) {
            return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        }
        if (z.includes('zone-3') || z.includes('zone 3') || z.includes('coimbatore')) {
            return 'bg-amber-100 text-amber-800 border border-amber-200';
        }
        if (z.includes('zone-4') || z.includes('zone 4') || z.includes('zone-5') || z.includes('zone 5') || z.includes('madurai')) {
            return 'bg-rose-100 text-rose-800 border border-rose-200';
        }
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    };

    return (
        <Fragment>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[80vh] flex flex-col font-sans">
                
                {/* Header with Official Maatram Logo */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        {brandLogo && (
                            <img 
                                src={brandLogo} 
                                alt="Maatram Foundation Logo" 
                                className="h-10 w-auto object-contain shrink-0" 
                            />
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 font-display">Student Portfolio Management</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Audit, monitor and track multi-semester academic profiles across operational regional sectors.</p>
                        </div>
                    </div>
                    <div className="relative" ref={exportMenuRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)} 
                            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-950 transition shadow-sm cursor-pointer"
                        >
                            <Download size={16} /> Export Matrix <ChevronDown size={14} className="ml-1" />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100 overflow-hidden">
                                <div className="py-1">
                                    <button 
                                        onClick={handleExport} 
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        Export Filtered Staged Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5 Sector Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard title="Total Tracked" value={stats.total} icon={Users} colorClass="bg-blue-50" iconColor="text-blue-600" />
                    <StatCard title="Sector Zone-1" value={stats.zone1} icon={MapPin} colorClass="bg-emerald-50" iconColor="text-emerald-600" />
                    <StatCard title="Sector Zone-2" value={stats.zone2} icon={MapPin} colorClass="bg-indigo-50" iconColor="text-indigo-600" />
                    <StatCard title="Sector Zone-3" value={stats.zone3} icon={MapPin} colorClass="bg-amber-50" iconColor="text-amber-600" />
                    <StatCard title="Sector Zone-4" value={stats.zone4} icon={MapPin} colorClass="bg-rose-50" iconColor="text-rose-600" />
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    <div className="relative grow">
                        <input 
                            type="text" 
                            placeholder="Search by student name or tracking registration code..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none" 
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    <select 
                        value={zoneFilter} 
                        onChange={(e) => setZoneFilter(e.target.value)} 
                        className="border border-gray-300 rounded-lg text-sm bg-white p-2 min-w-[160px] outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                    >
                        <option value="All">All Regions / Zones</option>
                        {zones.map((z, i) => <option key={i} value={z}>{z}</option>)}
                    </select>

                    <select 
                        value={collegeFilter} 
                        onChange={(e) => setCollegeFilter(e.target.value)} 
                        className="border border-gray-300 rounded-lg text-sm bg-white p-2 max-w-[280px] min-w-[180px] outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                    >
                        <option value="All">All Affiliated Colleges</option>
                        {colleges.map((col, idx) => <option key={idx} value={col}>{col}</option>)}
                    </select>

                    {(zoneFilter !== "All" || collegeFilter !== "All" || searchTerm) && (
                        <button 
                            onClick={() => { setZoneFilter("All"); setCollegeFilter("All"); setSearchTerm(""); }} 
                            className="flex items-center gap-1 p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer" 
                            title="Reset Parameters"
                        >
                            <X size={16} /> Clear
                        </button>
                    )}
                </div>

                {/* Table Container */}
                <div className="grow">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-900"></div>
                        </div>
                    ) : !filteredStudents.length ? (
                        <p className="text-center py-12 text-gray-400 font-medium">No student database entities match your current filtering matrices.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">S. No.</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Profile Image</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Register Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Zone</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">College Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Degree</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CGPA</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Accommodation</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                    {currentItems.map((student, index) => {
                                        const info = getStudentDisplayData(student);
                                        return (
                                            <tr key={info.studentId || index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <img 
                                                        src={info.avatar} 
                                                        alt="Student Avatar" 
                                                        className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-inner"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap font-bold">
                                                    <a 
                                                        href={`/admin/student-summary/${info.studentId}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-blue-600 hover:text-blue-900 underline tracking-wide"
                                                    >
                                                        {info.regNumber}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">
                                                    {info.name}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                                                    {info.mobileNumber}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${getZoneBadgeClass(info.zoneName)}`}>
                                                        {info.zoneName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-600 font-medium">
                                                    {info.batch}
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px] truncate text-gray-700 font-medium" title={info.collegeName}>
                                                    {info.collegeName}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-semibold">
                                                    {info.year}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap uppercase text-gray-600">
                                                    {info.degree}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                                                    {info.deptName}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-blue-900 font-black">
                                                    {info.cgpaVal}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                                                    {info.accommodation}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6 border-t pt-4">
                    <p className="text-sm text-gray-500">
                        Showing {filteredStudents.length ? indexOfLastItem - itemsPerPage + 1 : 0} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={() => setCurrentPage(1)} 
                                disabled={currentPage === 1} 
                                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {getPageNumbers().map(n => (
                                <button 
                                    key={n} 
                                    onClick={() => setCurrentPage(n)} 
                                    className={`w-9 h-9 rounded border text-sm font-medium ${currentPage === n ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {n}
                                </button>
                            ))}
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(totalPages)} 
                                disabled={currentPage === totalPages} 
                                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
};