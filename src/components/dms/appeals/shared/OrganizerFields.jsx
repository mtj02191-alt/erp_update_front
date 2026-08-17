import React from 'react';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import AppealImageUpload from './AppealImageUpload';

const OrganizerFields = ({ form, handleChange, onUrlChange, disabled = false }) => (
  <>
    <div className="form-grid-2">
      <FormInput label="Organizer name" name="organizer_name" value={form.organizer_name} onChange={handleChange} />
      <FormInput label="Organizer location" name="organizer_location" value={form.organizer_location} onChange={handleChange} />
    </div>
    <FormTextarea label="Organizer bio" name="organizer_bio" value={form.organizer_bio} onChange={handleChange} rows={2} />
    {onUrlChange ? (
      <AppealImageUpload
        label="Organizer image"
        purpose="organizer"
        urlFieldName="organizer_image_url"
        urlValue={form.organizer_image_url}
        onUrlChange={onUrlChange}
        disabled={disabled}
      />
    ) : (
      <FormInput label="Organizer image URL" name="organizer_image_url" value={form.organizer_image_url} onChange={handleChange} />
    )}
    <label style={{ display: 'block', marginTop: 8 }}>
      <input type="checkbox" name="organizer_verified" checked={form.organizer_verified} onChange={handleChange} /> Organizer verified
    </label>
  </>
);

export default OrganizerFields;
