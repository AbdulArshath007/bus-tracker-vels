import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { SkeletonStudentProfile } from '../components/Skeleton';

export const StudentProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Personal Details');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SkeletonStudentProfile />;

  // MOCK DATA exactly from the screenshot
  const student = {
    name: 'ABDUL ARSHATH B',
    admissionNo: 'UP24G6250061',
    registerNo: '24625164',
    course: 'B.Tech-Computer Science and Engineering [UG - Full Time]',
    academicYear: '2026-2027 / IV SEMESTER / B',
    institution: 'VELS INSTITUTE OF SCIENCE TECHNOLOGY AND ADVANCED STUDIES (VISTAS)',
    dobGender: '18-Apr-2007 / Male',
    regulation: 'Regulation 2022',
    courseStatus: 'Not Completed',
    parents: 'Basheer Ahamed A / abithunissa k m',
    address: 'No.1/2 THONDAI KHAN MAKKAN 2ND STREEET,TRIPLICANE, Chennai-600005',
    contact: '7904942917 / abdularshath180407@gmail.com',
    parentContact: '9941325050 / null',
    admittedDate: '15-May-2024',
    community: 'BC /',
    nationality: 'Indian / Muslim',
    hosteller: 'No'
  };

  const navItems = [
    'Personal Details',
    'Student Profile Entry',
    'Student Activity',
    'Student Activities New',
    'Course Registration',
    'Semester Wise Subjects',
    'Attendance Details',
    'Internal Mark Details',
    'Exam Result',
    'Fee Paid Details',
    'Fee Due Details',
    'Hall Ticket',
    'Student Bonafide Request',
    'SWAYAM/NPTEL Registration',
    'Placement Status',
    'Change Password'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', margin: '-2rem' }}>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Modern Sidebar replacing the legacy red/blue tables */}
        <aside style={{ width: '280px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          <div style={{ backgroundColor: '#FFF9C4', color: '#333', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Welcome</p>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1976D2', marginBottom: '0.25rem' }}>{student.name}</h3>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1976D2' }}>{student.admissionNo}</p>
          </div>

          <nav style={{ padding: '0.5rem 0' }}>
            {navItems.map(item => (
              <button 
                key={item}
                onClick={() => setActiveTab(item)}
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: activeTab === item ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === item ? 'white' : 'var(--text-main)',
                  fontWeight: activeTab === item ? 600 : 400,
                  borderLeft: activeTab === item ? '4px solid #fff' : '4px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
              >
                {item}
              </button>
            ))}
          </nav>

        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            
            <div style={{ backgroundColor: '#2170B5', color: 'white', padding: '1rem 1.5rem', fontWeight: 600, letterSpacing: '1px' }}>
              STUDENT PROFILE
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Student Name', value: student.name },
                { label: 'Admission No.', value: student.admissionNo },
                { label: 'Register No.', value: student.registerNo },
                { label: 'Course', value: student.course },
                { label: 'Academic Year / Semester / Section', value: student.academicYear },
                { label: 'Institution', value: student.institution },
                { label: 'D.O.B. / Gender', value: student.dobGender },
                { label: 'Regulation', value: student.regulation },
                { label: 'Course Complete Status', value: student.courseStatus },
                { label: 'Father Name / Mother Name', value: student.parents },
                { label: 'Residential Address', value: student.address },
                { label: 'Student Contact Number / Email', value: student.contact },
                { label: 'Parent Contact Number / Email', value: student.parentContact },
                { label: 'Admitted Date', value: student.admittedDate },
                { label: 'Community / Caste', value: student.community },
                { label: 'Nationality / Religion', value: student.nationality },
                { label: 'Hosteller', value: student.hosteller }
              ].map((row, idx) => (
                <div key={idx} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '300px 1fr', 
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'rgba(0,0,0,0.02)'
                }}>
                  <div style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.label}</div>
                  <div style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>{row.value}</div>
                </div>
              ))}
            </div>

          </div>
        </main>

      </div>

      {/* Footer replacing the bottom blue bar */}
      <footer style={{ backgroundColor: '#2170B5', color: 'white', padding: '0.5rem 1.5rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>User: {student.name} / {format(new Date(), 'EEE dd-MMM-yyyy HH:mm:ss')}</span>
        <span>eVarsity® ERP</span>
      </footer>

    </div>
  );
};
