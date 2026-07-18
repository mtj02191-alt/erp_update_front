import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import './index.css';
import { programs_list, program_vulnerabilities } from '../../../../../utils/program';

const AddTarget = () => {
  const navigate = useNavigate();
  
  const initialTargetRow = () => ({
    year: new Date().getFullYear().toString(),
    program: '',
    target: 0,
    reached: 0,
    target_type: ''
  });

  const [form, setForm] = useState({
    targets: [initialTargetRow()]
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRowChange = (index, field, value) => {
    setForm(prevForm => ({
      ...prevForm,
      targets: prevForm.targets.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const handleNumberChange = (index, field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setForm(prevForm => ({
      ...prevForm,
      targets: prevForm.targets.map((row, i) => 
        i === index ? { ...row, [field]: isNaN(numValue) ? 0 : Math.max(0, numValue) } : row
      )
    }));
  };

  const addRow = () => {
    setForm(prevForm => ({
      ...prevForm,
      targets: [...prevForm.targets, initialTargetRow()]
    }));
  };

  const removeRow = (index) => {
    if (form.targets.length <= 1) return;
    setForm(prevForm => ({
      ...prevForm,
      targets: prevForm.targets.filter((row, i) => i !== index)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validate that all targets have required fields
    const hasInvalidTargets = form.targets.some(target => !target.year || !target.program);
    if (hasInvalidTargets) {
      setError('Year and Program are required for all targets');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit all targets in a single request
      const payload = {
        targets: form.targets
      };
      
      await axiosInstance.post('/program/targets', payload); 
      navigate('/program/targets/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit targets. Please try again.');
      console.error('Error submitting targets:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearOptions = Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => {
    const year = 2015 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const programOptions = programs_list.map(program => ({
    value: program.key,
    label: program.label
  }));

  const targetTypeOptions = program_vulnerabilities.map(vulnerability => ({
    value: vulnerability.key,
    label: vulnerability.title
  }));

  const renderTargetItem = (target, index) => (
    <>
      <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end' }}>
        <FormSelect
          name="year"
          label="Year"
          value={target.year}
          onChange={e => handleRowChange(index, 'year', e.target.value)}
          options={yearOptions}
          required
        />
        <FormSelect
          name="program"
          label="Program"
          value={target.program}
          onChange={e => handleRowChange(index, 'program', e.target.value)}
          options={programOptions}
          required
          showDefaultOption={true}
          defaultOptionText="Select Program"
        />
      </div>
      <br />
      <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end' }}>
        <FormInput
          name="target"
          label="Target"
          type="number"
          // min="0"
          // step="1"
          // placeholder="0"
          value={target.target}
          onChange={e => handleNumberChange(index, 'target', e.target.value)}
          required
        />
        <FormInput
          name="reached"
          label="Reached"
          type="number"
          value={target.reached}
          onChange={e => handleNumberChange(index, 'reached', e.target.value)}
          required
        />
      </div>

      <br />
      <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end' }}>
        <FormSelect
          name="target_type"
          label="Target Type"
          value={target.target_type}
          onChange={e => handleRowChange(index, 'target_type', e.target.value)}
          options={targetTypeOptions}
          required
          showDefaultOption={true}
          defaultOptionText="Select Target Type"
        />
      </div>

    </>
  );

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Create Program Targets"
          showBackButton={true}
          backPath="/program/targets/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}

            <DynamicFormSection
              items={form.targets}
              onAdd={addRow}
              onRemove={removeRow}
              renderItem={renderTargetItem}
              titlePrefix="Target"
              canRemove={form.targets.length > 1}
            />

            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Targets'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTarget; 