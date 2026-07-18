// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axiosInstance from '../../../../../../utils/axios';
// import FormInput from '../../../../../common/FormInput';
// import FormSelect from '../../../../../common/FormSelect';
// import FormTextarea from '../../../../../common/FormTextarea';
// import Navbar from '../../../../../Navbar';
// import PageHeader from '../../../../../common/PageHeader';

// const AddJob = () => {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({
//     title: '',
//     slug: '', // Optional - auto-generated if not provided
//     icon: '',
//     department: 'IT',
//     type: 'Full Time',
//     location: '',
//     experience: '',
//     about: '',
//     qualifications: [''],
//     responsibilities: [''],
//     status: 'active',
//     is_featured: false,
//     posted_date: new Date().toISOString().split('T')[0],
//     closing_date: ''
//   });
  
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
    
//     if (error) setError('');
//   };

//   const handleArrayChange = (field, index, value) => {
//     setForm(prev => {
//       const newArray = [...prev[field]];
//       newArray[index] = value;
//       return { ...prev, [field]: newArray };
//     });
//   };

//   const addArrayItem = (field) => {
//     setForm(prev => ({
//       ...prev,
//       [field]: [...prev[field], '']
//     }));
//   };

//   const removeArrayItem = (field, index) => {
//     setForm(prev => ({
//       ...prev,
//       [field]: prev[field].filter((_, i) => i !== index)
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
    
//     try {
//       // Filter out empty strings from arrays
//       const jobData = {
//         ...form,
//         qualifications: form.qualifications.filter(q => q.trim() !== ''),
//         responsibilities: form.responsibilities.filter(r => r.trim() !== ''),
//         slug: form.slug || undefined, // Let backend auto-generate if empty
//         icon: form.icon || undefined,
//         experience: form.experience || undefined,
//         closing_date: form.closing_date || undefined,
//         posted_date: form.posted_date || new Date().toISOString()
//       };

//       // Validate arrays have at least one item
//       if (jobData.qualifications.length === 0) {
//         setError('At least one qualification is required');
//         setIsSubmitting(false);
//         return;
//       }

//       if (jobData.responsibilities.length === 0) {
//         setError('At least one responsibility is required');
//         setIsSubmitting(false);
//         return;
//       }

//       console.log('Submitting job data:', jobData);

//       await axiosInstance.post('/jobs', jobData);

//       // Redirect to jobs list after successful creation
//       navigate('/hr/careers/jobs/list'); 
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to add job. Please try again.');
//       console.error('Error adding job:', err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleBack = () => {
//     navigate('/hr/careers/jobs/list');
//   };

//   const departmentOptions = [
//     { value: 'it', label: 'IT' },
//     { value: 'marketing', label: 'Marketing' },
//     { value: 'operations', label: 'Operations' },
//     { value: 'store', label: 'Store' },
//     { value: 'procurements', label: 'Procurement' },
//     { value: 'accounts_and_finance', label: 'Accounts & Finance' },
//     { value: 'program', label: 'Program' },
//     { value: 'audio_video', label: 'Audio Video' },
//     { value: 'fund_raising', label: 'Fund Raising' },
//     { value: 'admin', label: 'Admin' },
//     { value: 'hr', label: 'HR' },
//     { value: 'audit', label: 'Audit' }
//   ];

//   const typeOptions = [
//     { value: 'Full Time', label: 'Full Time' },
//     { value: 'Part Time', label: 'Part Time' },
//     { value: 'Contract', label: 'Contract' }
//   ];

//   const statusOptions = [
//     { value: 'active', label: 'Active' },
//     { value: 'closed', label: 'Closed' },
//     { value: 'draft', label: 'Draft' }
//   ];

//   return (
//     <>
//       <Navbar />
//       <div className="form-content">
//         <PageHeader 
//           title="Add Job" 
//           onBack={handleBack}
//         />
        
//         {error && (
//           <div className="status-message status-message--error">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="form">
//           {/* Basic Information */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h3>
//             <div className="form-grid-2">
//               <FormInput
//                 label="Job Title"
//                 type="text"
//                 name="title"
//                 value={form.title}
//                 onChange={handleChange}
//                 required
//                 placeholder="e.g., Senior Software Engineer"
//               />

//               <FormInput
//                 label="Slug (Optional - Auto-generated if empty)"
//                 type="text"
//                 name="slug"
//                 value={form.slug}
//                 onChange={handleChange}
//                 placeholder="e.g., senior-software-engineer"
//               />

//               <FormInput
//                 label="Icon URL (Optional)"
//                 type="text"
//                 name="icon"
//                 value={form.icon}
//                 onChange={handleChange}
//                 placeholder="e.g., https://example.com/icon.png"
//               />

//               <FormSelect
//                 label="Department"
//                 name="department"
//                 value={form.department}
//                 onChange={handleChange}
//                 options={departmentOptions}
//                 required
//               />

//               <FormSelect
//                 label="Job Type"
//                 name="type"
//                 value={form.type}
//                 onChange={handleChange}
//                 options={typeOptions}
//                 required
//               />

//               <FormInput
//                 label="Location"
//                 type="text"
//                 name="location"
//                 value={form.location}
//                 onChange={handleChange}
//                 required
//                 placeholder="e.g., Karachi, Pakistan"
//               />

//               <FormInput
//                 label="Experience (Optional)"
//                 type="text"
//                 name="experience"
//                 value={form.experience}
//                 onChange={handleChange}
//                 placeholder="e.g., 3-5 years"
//               />

//               <FormSelect
//                 label="Status"
//                 name="status"
//                 value={form.status}
//                 onChange={handleChange}
//                 options={statusOptions}
//                 required
//               />
//             </div>
//           </div>

//           {/* Dates */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Dates</h3>
//             <div className="form-grid-2">
//               <FormInput
//                 label="Posted Date"
//                 type="date"
//                 name="posted_date"
//                 value={form.posted_date}
//                 onChange={handleChange}
//                 required
//               />

//               <FormInput
//                 label="Closing Date (Optional)"
//                 type="date"
//                 name="closing_date"
//                 value={form.closing_date}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           {/* About */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Job Description</h3>
//             <FormTextarea
//               label="About"
//               name="about"
//               value={form.about}
//               onChange={handleChange}
//               required
//               placeholder="Describe the job position, company culture, and what makes this role unique..."
//               rows={6}
//             />
//           </div>

//           {/* Qualifications */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Qualifications</h3>
//             <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
//               Add at least one qualification requirement
//             </p>
//             {form.qualifications.map((qual, index) => (
//               <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
//                 <FormInput
//                   label={index === 0 ? "Qualification" : ""}
//                   type="text"
//                   value={qual}
//                   onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
//                   placeholder={`Qualification ${index + 1}`}
//                   required={index === 0}
//                   style={{ flex: 1 }}
//                 />
//                 {form.qualifications.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeArrayItem('qualifications', index)}
//                     style={{
//                       marginTop: index === 0 ? '28px' : '0',
//                       padding: '8px 16px',
//                       backgroundColor: '#f44336',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '6px',
//                       cursor: 'pointer',
//                       fontSize: '14px'
//                     }}
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//             ))}
//             <button
//               type="button"
//               onClick={() => addArrayItem('qualifications')}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#4CAF50',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: '500'
//               }}
//             >
//               + Add Qualification
//             </button>
//           </div>

//           {/* Responsibilities */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Responsibilities</h3>
//             <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
//               Add at least one responsibility
//             </p>
//             {form.responsibilities.map((resp, index) => (
//               <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
//                 <FormInput
//                   label={index === 0 ? "Responsibility" : ""}
//                   type="text"
//                   value={resp}
//                   onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
//                   placeholder={`Responsibility ${index + 1}`}
//                   required={index === 0}
//                   style={{ flex: 1 }}
//                 />
//                 {form.responsibilities.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeArrayItem('responsibilities', index)}
//                     style={{
//                       marginTop: index === 0 ? '28px' : '0',
//                       padding: '8px 16px',
//                       backgroundColor: '#f44336',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '6px',
//                       cursor: 'pointer',
//                       fontSize: '14px'
//                     }}
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//             ))}
//             <button
//               type="button"
//               onClick={() => addArrayItem('responsibilities')}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#4CAF50',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: '500'
//               }}
//             >
//               + Add Responsibility
//             </button>
//           </div>

//           {/* Additional Options */}
//           <div className="form-section">
//             <h3 style={{ marginBottom: '15px', color: '#333' }}>Additional Options</h3>
//             <div className="form-grid-2">
//               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                 <input
//                   type="checkbox"
//                   name="is_featured"
//                   checked={form.is_featured}
//                   onChange={handleChange}
//                   id="is_featured"
//                 />
//                 <label htmlFor="is_featured" style={{ fontSize: '14px', fontWeight: '500' }}>
//                   Feature this job (show with star icon)
//                 </label>
//               </div>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button 
//               type="submit" 
//               className="primary_btn" 
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? 'Adding Job...' : 'Add Job'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </>
//   );
// };

// export default AddJob;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import FormInput from '../../../../../common/FormInput';
import FormSelect from '../../../../../common/FormSelect';
import FormTextarea from '../../../../../common/FormTextarea';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';

const AddJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    slug: '', // Optional - auto-generated if not provided
    icon: '',
    department: 'IT',
    type: 'Full Time',
    location: '',
    experience: [''],
    skills: [''],
    about: '',
    qualifications: [''],
    responsibilities: [''],
    status: 'active',
    is_featured: false,
    posted_date: new Date().toISOString().split('T')[0],
    closing_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) setError('');
  };

  const handleArrayChange = (field, index, value) => {
    setForm(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const jobData = {
        ...form,
        qualifications: form.qualifications.filter(q => q.trim() !== ''),
        responsibilities: form.responsibilities.filter(r => r.trim() !== ''),
        experience: form.experience.filter(exp => exp.trim() !== ''),
        skills: form.skills.filter(skill => skill.trim() !== ''),
        slug: form.slug || undefined,
        icon: form.icon || undefined,
        closing_date: form.closing_date || undefined,
        posted_date: form.posted_date || undefined
      };

      if (jobData.qualifications.length === 0) {
        setError('At least one qualification is required');
        setIsSubmitting(false);
        return;
      }

      if (jobData.responsibilities.length === 0) {
        setError('At least one responsibility is required');
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting job data:', jobData);

      await axiosInstance.post('/jobs', jobData);

      navigate('/hr/careers/jobs/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add job. Please try again.');
      console.error('Error adding job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/careers/jobs/list');
  };

  const departmentOptions = [
    { value: 'it', label: 'IT' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'store', label: 'Store' },
    { value: 'procurements', label: 'Procurement' },
    { value: 'accounts_and_finance', label: 'Accounts & Finance' },
    { value: 'program', label: 'Program' },
    { value: 'audio_video', label: 'Audio Video' },
    { value: 'fund_raising', label: 'Fund Raising' },
    { value: 'admin', label: 'Admin' },
    { value: 'hr', label: 'HR' },
    { value: 'audit', label: 'Audit' }
  ];

  const typeOptions = [
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
    { value: 'Contract', label: 'Contract' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'draft', label: 'Draft' }
  ];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Add Job"
          onBack={handleBack}
        />

        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h3>
            <div className="form-grid-2">
              <FormInput
                label="Job Title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior Software Engineer"
              />

              <FormInput
                label="Slug (Optional - Auto-generated if empty)"
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g., senior-software-engineer"
              />

              <FormInput
                label="Icon URL (Optional)"
                type="text"
                name="icon"
                value={form.icon}
                onChange={handleChange}
                placeholder="e.g., https://example.com/icon.png"
              />

              <FormSelect
                label="Department"
                name="department"
                value={form.department}
                onChange={handleChange}
                options={departmentOptions}
                required
              />

              <FormSelect
                label="Job Type"
                name="type"
                value={form.type}
                onChange={handleChange}
                options={typeOptions}
                required
              />

              <FormInput
                label="Location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="e.g., Karachi, Pakistan"
              />

              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Dates</h3>
            <div className="form-grid-2">
              <FormInput
                label="Posted Date"
                type="date"
                name="posted_date"
                value={form.posted_date}
                onChange={handleChange}
              />

              <FormInput
                label="Closing Date (Optional)"
                type="date"
                name="closing_date"
                value={form.closing_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Job Description</h3>
            <FormTextarea
              label="About"
              name="about"
              value={form.about}
              onChange={handleChange}
              required
              placeholder="Describe the job position, company culture, and what makes this role unique..."
              rows={6}
            />
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Qualifications</h3>
            {form.qualifications.map((qual, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <FormInput
                  label={index === 0 ? 'Qualification' : ''}
                  type="text"
                  value={qual}
                  onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
                  placeholder={`Qualification ${index + 1}`}
                  required={index === 0}
                  style={{ flex: 1 }}
                />
                {form.qualifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('qualifications', index)}
                    style={{
                      marginTop: index === 0 ? '28px' : '0',
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('qualifications')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Qualification
            </button>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Experience</h3>
            {form.experience.map((exp, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <FormInput
                  label={index === 0 ? 'Experience' : ''}
                  type="text"
                  value={exp}
                  onChange={(e) => handleArrayChange('experience', index, e.target.value)}
                  placeholder={`Experience ${index + 1}`}
                  style={{ flex: 1 }}
                />
                {form.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('experience', index)}
                    style={{
                      marginTop: index === 0 ? '28px' : '0',
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('experience')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Experience
            </button>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Skills</h3>
            {form.skills.map((skill, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <FormInput
                  label={index === 0 ? 'Skill' : ''}
                  type="text"
                  value={skill}
                  onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                  placeholder={`Skill ${index + 1}`}
                  style={{ flex: 1 }}
                />
                {form.skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('skills', index)}
                    style={{
                      marginTop: index === 0 ? '28px' : '0',
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('skills')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Skill
            </button>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Responsibilities</h3>
            {form.responsibilities.map((resp, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <FormInput
                  label={index === 0 ? 'Responsibility' : ''}
                  type="text"
                  value={resp}
                  onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                  placeholder={`Responsibility ${index + 1}`}
                  required={index === 0}
                  style={{ flex: 1 }}
                />
                {form.responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    style={{
                      marginTop: index === 0 ? '28px' : '0',
                      padding: '8px 16px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('responsibilities')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Responsibility
            </button>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Additional Options</h3>
            <div className="form-grid-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                  id="is_featured"
                />
                <label htmlFor="is_featured" style={{ fontSize: '14px', fontWeight: '500' }}>
                  Feature this job (show with star icon)
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary_btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Job...' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddJob;