import React from 'react';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import PageContentImageUpload from './PageContentImageUpload';
import { emptyFaqItem, emptySubProject } from './pageContentUtils';

const PageContentEditor = ({ pageContent, setPageContent, catalogTitle, catalogCategory }) => {
  const updateRoot = (key, value) => {
    setPageContent((prev) => ({ ...prev, [key]: value }));
  };

  const updateContent = (key, value) => {
    setPageContent((prev) => ({
      ...prev,
      content: { ...prev.content, [key]: value },
    }));
  };

  const updateFaqs = (key, value) => {
    setPageContent((prev) => ({
      ...prev,
      faqs: { ...prev.faqs, [key]: value },
    }));
  };

  const updateTestimonials = (key, value) => {
    setPageContent((prev) => ({
      ...prev,
      testimonials: { ...prev.testimonials, [key]: value },
    }));
  };

  const updateSubProject = (index, key, value) => {
    setPageContent((prev) => ({
      ...prev,
      sub_projects: prev.sub_projects.map((row, i) =>
        i === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const updateFaqItem = (index, key, value) => {
    setPageContent((prev) => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        items: prev.faqs.items.map((row, i) =>
          i === index ? { ...row, [key]: value } : row,
        ),
      },
    }));
  };

  return (
    <div className="website-project-page-editor">
      <p className="wdp-help">
        Page content for the public project detail page (hero, intro, content blocks, FAQs).
        Donation checkout options stay on the Donation catalog tab.
      </p>

      <label className="wdp-checkbox-label">
        <input
          type="checkbox"
          checked={pageContent.is_published}
          onChange={(e) => updateRoot('is_published', e.target.checked)}
        />
        <span>
          Publish project page (saved in DMS; website currently uses static data)
        </span>
      </label>

      <h3 className="form-section-heading">Hero &amp; page settings</h3>
      <div className="form-grid">
        <FormInput
          label="Page title (optional override)"
          name="page_title"
          value={pageContent.page_title}
          onChange={(e) => updateRoot('page_title', e.target.value)}
          placeholder={catalogTitle || 'Uses catalog title if empty'}
        />
        <FormInput
          label="Donate category label"
          name="donate_category"
          value={pageContent.donate_category}
          onChange={(e) => updateRoot('donate_category', e.target.value)}
          placeholder={catalogCategory || 'General'}
        />
        <PageContentImageUpload
          label="Header image (desktop)"
          value={pageContent.header_image_url}
          onChange={(url) => updateRoot('header_image_url', url)}
        />
        <PageContentImageUpload
          label="Header image (mobile)"
          value={pageContent.header_image_mob_url}
          onChange={(url) => updateRoot('header_image_mob_url', url)}
        />
        <PageContentImageUpload
          label="Main footer / banner image"
          value={pageContent.main_image_url}
          onChange={(url) => updateRoot('main_image_url', url)}
        />
        <FormInput
          label="Default donate button text"
          name="donate_button_text"
          value={pageContent.donate_button_text}
          onChange={(e) => updateRoot('donate_button_text', e.target.value)}
        />
      </div>

      <h3 className="form-section-heading">Intro content</h3>
      <div className="form-grid">
        <FormTextarea
          label="Subtitle"
          name="content_subtitle"
          value={pageContent.content.subtitle}
          onChange={(e) => updateContent('subtitle', e.target.value)}
        />
        <FormTextarea
          label="Paragraph 1"
          name="content_p1"
          value={pageContent.content.paragraph1}
          onChange={(e) => updateContent('paragraph1', e.target.value)}
        />
        <FormTextarea
          label="Paragraph 2"
          name="content_p2"
          value={pageContent.content.paragraph2}
          onChange={(e) => updateContent('paragraph2', e.target.value)}
        />
        <FormTextarea
          label="Paragraph 3"
          name="content_p3"
          value={pageContent.content.paragraph3}
          onChange={(e) => updateContent('paragraph3', e.target.value)}
        />
      </div>

      <h3 className="form-section-heading">Content blocks (MediaContentSection)</h3>
      <p className="wdp-help">
        Each block appears as an alternating image + text section on the project page.
      </p>
      {pageContent.sub_projects.map((row, index) => (
        <div key={`sp-${index}`} className="wdp-repeat-card">
          <div className="wdp-repeat-card__header">
            <h4 className="wdp-repeat-card__title">
              Block {index + 1}
              {row.title ? `: ${row.title}` : ''}
            </h4>
            <button
              type="button"
              className="secondary_btn secondary_btn--danger"
              onClick={() =>
                setPageContent((prev) => ({
                  ...prev,
                  sub_projects: prev.sub_projects.filter((_, i) => i !== index),
                }))
              }
            >
              Remove
            </button>
          </div>
          <div className="form-grid">
            <FormInput
              label="Block ID (unique slug)"
              name={`sp-id-${index}`}
              value={row.id}
              onChange={(e) => updateSubProject(index, 'id', e.target.value)}
              placeholder="al-husnain-school-system"
            />
            <FormInput
              label="Title"
              name={`sp-title-${index}`}
              value={row.title}
              onChange={(e) => updateSubProject(index, 'title', e.target.value)}
            />
            <FormInput
              label="Subtitle"
              name={`sp-sub-${index}`}
              value={row.subtitle}
              onChange={(e) => updateSubProject(index, 'subtitle', e.target.value)}
            />
            <PageContentImageUpload
              label="Block image"
              value={row.image_url}
              onChange={(url) => updateSubProject(index, 'image_url', url)}
            />
            <FormInput
              label="Video URL (YouTube, optional)"
              name={`sp-vid-${index}`}
              value={row.video_url}
              onChange={(e) => updateSubProject(index, 'video_url', e.target.value)}
            />
            <FormInput
              label="Donate button text"
              name={`sp-btn-${index}`}
              value={row.donate_button_text}
              onChange={(e) => updateSubProject(index, 'donate_button_text', e.target.value)}
            />
            <FormInput
              label="Donation link (optional)"
              name={`sp-url-${index}`}
              value={row.donation_url}
              onChange={(e) => updateSubProject(index, 'donation_url', e.target.value)}
            />
          </div>
          <FormTextarea
            label="Description"
            name={`sp-desc-${index}`}
            value={row.description}
            onChange={(e) => updateSubProject(index, 'description', e.target.value)}
          />
          <FormTextarea
            label="Description 2 (optional second paragraph)"
            name={`sp-desc2-${index}`}
            value={row.description2}
            onChange={(e) => updateSubProject(index, 'description2', e.target.value)}
          />
          <FormTextarea
            label="Impact line (shown as heading)"
            name={`sp-impact-${index}`}
            value={row.impact}
            onChange={(e) => updateSubProject(index, 'impact', e.target.value)}
          />
          <FormTextarea
            label="Programs / bullet list (one item per line)"
            name={`sp-prog-${index}`}
            value={row.programsText}
            onChange={(e) => updateSubProject(index, 'programsText', e.target.value)}
          />
          <FormTextarea
            label="Quran ayat text (optional)"
            name={`sp-ayat-text-${index}`}
            value={row.quran_ayat_text || ''}
            onChange={(e) => updateSubProject(index, 'quran_ayat_text', e.target.value)}
            placeholder="Take from their wealth charity by which you purify them and cause them increase."
          />
          <FormInput
            label="Quran ayat reference (optional)"
            name={`sp-ayat-ref-${index}`}
            value={row.quran_ayat_reference || ''}
            onChange={(e) => updateSubProject(index, 'quran_ayat_reference', e.target.value)}
            placeholder="Surah At-Tawbah 9:103"
          />
          <FormTextarea
            label="Bottom text (optional closing paragraph)"
            name={`sp-bottom-${index}`}
            value={row.bottom_text}
            onChange={(e) => updateSubProject(index, 'bottom_text', e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        className="secondary_btn wdp-add-btn"
        onClick={() =>
          setPageContent((prev) => ({
            ...prev,
            sub_projects: [...prev.sub_projects, emptySubProject()],
          }))
        }
      >
        + Add content block
      </button>

      <h3 className="form-section-heading">FAQs</h3>
      <div className="form-grid">
        <FormInput
          label="FAQs section title"
          name="faqs_title"
          value={pageContent.faqs.title}
          onChange={(e) => updateFaqs('title', e.target.value)}
        />
        <FormInput
          label="FAQs subtitle"
          name="faqs_subtitle"
          value={pageContent.faqs.subtitle}
          onChange={(e) => updateFaqs('subtitle', e.target.value)}
        />
      </div>
      {pageContent.faqs.items.map((row, index) => (
        <div key={`faq-${index}`} className="wdp-repeat-card">
          <div className="wdp-repeat-card__header">
            <h4 className="wdp-repeat-card__title">FAQ {index + 1}</h4>
            <button
              type="button"
              className="secondary_btn secondary_btn--danger"
              onClick={() =>
                setPageContent((prev) => ({
                  ...prev,
                  faqs: {
                    ...prev.faqs,
                    items: prev.faqs.items.filter((_, i) => i !== index),
                  },
                }))
              }
            >
              Remove
            </button>
          </div>
          <FormInput
            label="Question"
            name={`faq-q-${index}`}
            value={row.question}
            onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
          />
          <FormTextarea
            label="Answer"
            name={`faq-a-${index}`}
            value={row.answer}
            onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
          />
        </div>
      ))}
      <button
        type="button"
        className="secondary_btn wdp-add-btn"
        onClick={() =>
          setPageContent((prev) => ({
            ...prev,
            faqs: { ...prev.faqs, items: [...prev.faqs.items, emptyFaqItem()] },
          }))
        }
      >
        + Add FAQ
      </button>

      <h3 className="form-section-heading">Testimonials (page bottom)</h3>
      <div className="form-grid">
        <FormInput
          label="Title"
          name="test_title"
          value={pageContent.testimonials.title}
          onChange={(e) => updateTestimonials('title', e.target.value)}
        />
        <FormInput
          label="Subtitle"
          name="test_sub"
          value={pageContent.testimonials.subtitle}
          onChange={(e) => updateTestimonials('subtitle', e.target.value)}
        />
      </div>
      <label className="wdp-checkbox-label">
        <input
          type="checkbox"
          checked={pageContent.testimonials.mobile_only}
          onChange={(e) => updateTestimonials('mobile_only', e.target.checked)}
        />
        <span>Show testimonials on mobile only</span>
      </label>
      <FormTextarea
        label="YouTube video URLs (one per line)"
        name="test_videos"
        value={pageContent.testimonials.videosText}
        onChange={(e) => updateTestimonials('videosText', e.target.value)}
      />
    </div>
  );
};

export default PageContentEditor;
