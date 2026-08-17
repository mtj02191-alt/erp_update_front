export const mapAppealToForm = (appeal) => {
  const b = appeal.beneficiary || {};
  return {
    title: appeal.title || '',
    slug: appeal.slug || '',
    short_description: appeal.short_description || '',
    story: appeal.story || '',
    status: appeal.status || 'draft',
    category: appeal.category || 'medical',
    tags: appeal.tags || '',
    goal_amount: appeal.goal_amount != null ? String(appeal.goal_amount) : '',
    currency: appeal.currency || 'PKR',
    start_at: appeal.start_at ? new Date(appeal.start_at).toISOString().slice(0, 16) : '',
    end_at: appeal.end_at ? new Date(appeal.end_at).toISOString().slice(0, 16) : '',
    cover_image_url: appeal.cover_image_url || '',
    is_featured: appeal.is_featured ?? false,
    is_urgent: appeal.is_urgent ?? false,
    is_verified: appeal.is_verified ?? true,
    donation_protected: appeal.donation_protected ?? true,
    organizer_name: appeal.organizer_name || '',
    organizer_location: appeal.organizer_location || '',
    organizer_bio: appeal.organizer_bio || '',
    organizer_image_url: appeal.organizer_image_url || '',
    organizer_verified: appeal.organizer_verified ?? false,
    impact_points_text: Array.isArray(appeal.impact_points)
      ? appeal.impact_points.join('\n')
      : '',
    beneficiary_name: b.name || '',
    beneficiary_age: b.age != null ? String(b.age) : '',
    beneficiary_location: b.location || '',
    beneficiary_bio: b.bio || '',
    beneficiary_profile_image_url: b.profile_image_url || '',
    gallery_image_urls: [],
  };
};

export const buildAppealPayload = (form) => ({
  title: form.title,
  slug: form.slug || undefined,
  short_description: form.short_description || undefined,
  story: form.story || undefined,
  status: form.status,
  category: form.category,
  tags: form.tags || undefined,
  goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null,
  currency: form.currency,
  start_at: form.start_at || undefined,
  end_at: form.end_at || undefined,
  cover_image_url: form.cover_image_url || undefined,
  is_featured: form.is_featured,
  is_urgent: form.is_urgent,
  is_verified: form.is_verified,
  donation_protected: form.donation_protected,
  organizer_name: form.organizer_name || undefined,
  organizer_location: form.organizer_location || undefined,
  organizer_bio: form.organizer_bio || undefined,
  organizer_image_url: form.organizer_image_url || undefined,
  organizer_verified: form.organizer_verified,
  impact_points: form.impact_points_text
    ? form.impact_points_text.split('\n').map((s) => s.trim()).filter(Boolean)
    : undefined,
  beneficiary: {
    name: form.beneficiary_name,
    age: form.beneficiary_age ? parseInt(form.beneficiary_age, 10) : undefined,
    location: form.beneficiary_location || undefined,
    bio: form.beneficiary_bio || undefined,
    profile_image_url: form.beneficiary_profile_image_url || undefined,
  },
  gallery_image_urls:
    Array.isArray(form.gallery_image_urls) && form.gallery_image_urls.length > 0
      ? form.gallery_image_urls
      : undefined,
});
