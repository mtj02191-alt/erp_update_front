export const emptyInitiative = () => ({
  id: undefined,
  slug: '',
  title: '',
  subtitle: '',
  price: '',
  description: '',
  duration: '',
  icon_key: '',
  template_code: '',
  sort_order: 10,
  is_active: true,
});

export const emptySubProject = () => ({
  id: '',
  title: '',
  subtitle: '',
  description: '',
  description2: '',
  impact: '',
  programsText: '',
  image_url: '',
  video_url: '',
  donate_button_text: '',
  donation_url: '',
  bottom_text: '',
  quran_ayat_text: '',
  quran_ayat_reference: '',
});

const quranAyatFromRaw = (raw) => {
  const ayat = raw?.quran_ayat || raw?.quranAyat || null;
  return {
    quran_ayat_text: ayat?.text || '',
    quran_ayat_reference: ayat?.reference || '',
  };
};

const quranAyatToApi = (sp) => {
  const text = sp.quran_ayat_text?.trim() || '';
  const reference = sp.quran_ayat_reference?.trim() || '';
  if (!text && !reference) return null;
  return { text, reference };
};

export const emptyFaqItem = () => ({
  question: '',
  answer: '',
});

export const emptyPageContent = () => ({
  is_published: false,
  page_title: '',
  header_image_url: '',
  header_image_mob_url: '',
  main_image_url: '',
  donate_category: '',
  donate_button_text: '',
  content: {
    subtitle: '',
    paragraph1: '',
    paragraph2: '',
    paragraph3: '',
  },
  sub_projects: [],
  faqs: {
    title: '',
    subtitle: '',
    items: [],
  },
  testimonials: {
    title: '',
    subtitle: '',
    mobile_only: false,
    videosText: '',
  },
});

const linesToArray = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const arrayToLines = (arr) =>
  Array.isArray(arr) ? arr.filter(Boolean).join('\n') : '';

/** API / DB → editor form state */
export const pageContentFromApi = (raw) => {
  if (!raw || typeof raw !== 'object') return emptyPageContent();
  return {
    is_published: !!raw.is_published,
    page_title: raw.page_title || '',
    header_image_url: raw.header_image_url || raw.headerImage || '',
    header_image_mob_url: raw.header_image_mob_url || raw.headerImageMob || '',
    main_image_url: raw.main_image_url || raw.mainImage || '',
    donate_category: raw.donate_category || '',
    donate_button_text: raw.donate_button_text || '',
    content: {
      subtitle: raw.content?.subtitle || '',
      paragraph1: raw.content?.paragraph1 || '',
      paragraph2: raw.content?.paragraph2 || '',
      paragraph3: raw.content?.paragraph3 || '',
    },
    sub_projects: (raw.sub_projects || []).map((sp) => ({
      id: sp.id || sp.slug || '',
      title: sp.title || '',
      subtitle: sp.subtitle || '',
      description: sp.description || '',
      description2: sp.description2 || '',
      impact: sp.impact || '',
      programsText: arrayToLines(sp.programs),
      image_url: sp.image_url || sp.image || '',
      video_url: sp.video_url || sp.video || '',
      donate_button_text: sp.donate_button_text || sp.donateButtonText || '',
      donation_url: sp.donation_url || sp.donationUrl || '',
      bottom_text: sp.bottom_text || sp.bottomText || '',
      ...quranAyatFromRaw(sp),
    })),
    faqs: {
      title: raw.faqs?.title || '',
      subtitle: raw.faqs?.subtitle || '',
      items: (raw.faqs?.items || raw.faqs?.faqs || []).map((f) => ({
        question: f.question || '',
        answer: f.answer || '',
      })),
    },
    testimonials: {
      title: raw.testimonials?.title || '',
      subtitle: raw.testimonials?.subtitle || '',
      mobile_only: !!raw.testimonials?.mobile_only,
      videosText: arrayToLines(raw.testimonials?.videos),
    },
  };
};

/** Editor form state → API payload */
export const pageContentToApi = (form, catalogTitle = '') => ({
  is_published: !!form.is_published,
  page_title: form.page_title?.trim() || catalogTitle || '',
  header_image_url: form.header_image_url?.trim() || '',
  header_image_mob_url: form.header_image_mob_url?.trim() || '',
  main_image_url: form.main_image_url?.trim() || '',
  donate_category: form.donate_category?.trim() || '',
  donate_button_text: form.donate_button_text?.trim() || '',
  content: {
    subtitle: form.content?.subtitle?.trim() || '',
    paragraph1: form.content?.paragraph1?.trim() || '',
    paragraph2: form.content?.paragraph2?.trim() || '',
    paragraph3: form.content?.paragraph3?.trim() || '',
  },
  sub_projects: (form.sub_projects || []).map((sp, index) => ({
    id: sp.id?.trim() || `section-${index + 1}`,
    title: sp.title?.trim() || '',
    subtitle: sp.subtitle?.trim() || '',
    description: sp.description?.trim() || '',
    description2: sp.description2?.trim() || '',
    impact: sp.impact?.trim() || '',
    programs: linesToArray(sp.programsText),
    image_url: sp.image_url?.trim() || '',
    video_url: sp.video_url?.trim() || '',
    donate_button_text: sp.donate_button_text?.trim() || '',
    donation_url: sp.donation_url?.trim() || '',
    bottom_text: sp.bottom_text?.trim() || '',
    quran_ayat: quranAyatToApi(sp),
  })),
  faqs: {
    title: form.faqs?.title?.trim() || '',
    subtitle: form.faqs?.subtitle?.trim() || '',
    items: (form.faqs?.items || [])
      .filter((f) => f.question?.trim() || f.answer?.trim())
      .map((f) => ({
        question: f.question?.trim() || '',
        answer: f.answer?.trim() || '',
      })),
  },
  testimonials: {
    title: form.testimonials?.title?.trim() || '',
    subtitle: form.testimonials?.subtitle?.trim() || '',
    mobile_only: !!form.testimonials?.mobile_only,
    videos: linesToArray(form.testimonials?.videosText),
  },
});

/** Editor state → website preview shape (MediaContentSection / FAQs / PageHeader) */
export const pageContentToPreview = (form, catalog = {}) => {
  const api = pageContentToApi(form, catalog.title);
  return {
    id: catalog.slug || 'preview',
    title: api.page_title || catalog.title || 'Project preview',
    headerImage: api.header_image_url,
    headerImageMob: api.header_image_mob_url,
    mainImage: api.main_image_url,
    donateCategory: api.donate_category || catalog.category,
    donateButtonText: api.donate_button_text,
    content: api.content,
    subProjects: api.sub_projects.map((sp) => ({
      id: sp.id,
      title: sp.title,
      subtitle: sp.subtitle,
      description: sp.description,
      description2: sp.description2,
      impact: sp.impact,
      programs: sp.programs,
      image: sp.image_url,
      video: sp.video_url,
      donateButtonText: sp.donate_button_text,
      donationUrl: sp.donation_url,
      bottomText: sp.bottom_text,
      quranAyat: sp.quran_ayat,
    })),
    faqs: api.faqs.items?.length
      ? {
          title: api.faqs.title,
          subtitle: api.faqs.subtitle,
          faqs: api.faqs.items,
        }
      : null,
    testimonials: api.testimonials.videos?.length
      ? {
          title: api.testimonials.title,
          subtitle: api.testimonials.subtitle,
          mobileOnly: api.testimonials.mobile_only,
          videos: api.testimonials.videos,
        }
      : null,
  };
};
