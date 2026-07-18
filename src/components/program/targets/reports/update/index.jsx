import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import './index.css';
import { programs_list, program_vulnerabilities } from '../../../../../utils/program';

const UpdateTarget = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    year: '',
    program: '',
    target: 0,
    reached: 0,
    target_type: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTarget();
  }, [id]);

  const fetchTarget = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/targets/${id}`);
      
      if (response.data.success) {
        const targetData = response.data.data;
                 setForm({
           year: targetData.year || '',
           program: targetData.program || '',
           target: targetData.target || 0,
           reached: targetData.reached || 0,
           target_type: targetData.target_type || ''
         });
        setError('');
      } else {
        setError('Failed to fetch target data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch target data. Please try again.');
      console.error('Error fetching target:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleNumberChange = e => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setForm(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : Math.max(0, numValue)
    }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.year || !form.program) {
      setError('Year and Program are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/targets/${id}`, form);
      navigate('/program/targets/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update target. Please try again.');
      console.error('Error updating target:', err);
    } finally {
      setIsSubmitting(false);
    }
  };



  const programOptions = programs_list.map(program => ({
    value: program.key,
    label: program.label
  }));

  const targetTypeOptions = program_vulnerabilities.map(vulnerability => ({
    value: vulnerability.key,
    label: vulnerability.title
  }));

  const yearOptions = Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => {
    const year = 2015 + i;
    return { value: year.toString(), label: year.toString() };
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <PageHeader 
            title="Update Program Target"
            showBackButton={true}
            backPath="/program/targets/reports/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Update Program Target"
          showBackButton={true}
          backPath="/program/targets/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            
            <div className="form-grid-2">
              <FormSelect
                name="year"
                label="Year"
                value={form.year}
                onChange={handleChange}
                options={yearOptions}
                required
              />
                             <FormSelect
                 name="program"
                 label="Program"
                 value={form.program}
                 onChange={handleChange}
                 options={programOptions}
                 required
                 showDefaultOption={true}
                 defaultOptionText="Select Program"
               />
            </div>

            <div className="form-grid-2">
              <FormInput
                name="target"
                label="Target"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.target}
                onChange={handleNumberChange}
                required
              />
              <FormInput
                name="reached"
                label="Reached"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.reached}
                onChange={handleNumberChange}
                required
              />
            </div>

                         <div className="form-grid-2">
               <FormSelect
                 name="target_type"
                 label="Target Type"
                 value={form.target_type}
                 onChange={handleChange}
                 options={targetTypeOptions}
                 required
                 showDefaultOption={true}
                 defaultOptionText="Select Target Type"
               />
             </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Target'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateTarget; 