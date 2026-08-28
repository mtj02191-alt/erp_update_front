import React, { Suspense, lazy } from 'react';
import PageHeader from '@/components/pageHeader/PageHeader';
import { pageContentToPreview } from './pageContentUtils';
import '@/components/pageHeader/PageHeader.css';
import '@/components/mediaContentSection/MediaContentSection.css';
import '@/components/faqs/FAQs.css';

const MediaContentSection = lazy(() =>
  import('@/components/mediaContentSection/MediaContentSection'),
);
const FAQs = lazy(() => import('@/components/faqs/FAQs'));

const PageContentPreview = ({ pageContent, catalog }) => {
  const project = pageContentToPreview(pageContent, catalog);

  return (
    <div className="wdp-preview-panel">
      <div className="wdp-preview-panel__header">
        Live preview — updates as you edit fields on the Page content tab
      </div>
      <div className="wdp-preview-panel__body">
        {project.headerImage ? (
          <PageHeader
            title={project.title}
            image={project.headerImage}
            imageMob={project.headerImageMob}
          />
        ) : (
          <div className="wdp-preview-empty">
            Add a header image URL to preview the hero section
          </div>
        )}

        {project.mainImage ? (
          <section className="project-full-image-section" style={{ margin: '24px 0' }}>
            <img
              src={project.mainImage}
              alt={`${project.title} banner`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </section>
        ) : null}

        {(project.content?.paragraph1 ||
          project.content?.paragraph2 ||
          project.content?.subtitle) && (
          <section className="container py-48" style={{ padding: '24px 16px' }}>
            <h2>{project.title}</h2>
            {project.content.subtitle && <p>{project.content.subtitle}</p>}
            {project.content.paragraph1 && <p>{project.content.paragraph1}</p>}
            {project.content.paragraph2 && <p>{project.content.paragraph2}</p>}
            {project.content.paragraph3 && <p>{project.content.paragraph3}</p>}
          </section>
        )}

        <Suspense fallback={<div className="wdp-preview-empty">Loading sections…</div>}>
          {project.subProjects?.length > 0 ? (
            <MediaContentSection
              subProjects={project.subProjects}
              defaultImage={project.mainImage}
              projectKey={project.id}
            />
          ) : (
            <div className="wdp-preview-empty">
              Add content blocks to preview MediaContentSection
            </div>
          )}

          {project.faqs?.faqs?.length > 0 && (
            <FAQs
              title={project.faqs.title}
              subtitle={project.faqs.subtitle}
              faqs={project.faqs.faqs}
            />
          )}

          {project.testimonials?.videos?.length > 0 && (
            <section className="container py-48" style={{ padding: '24px 16px' }}>
              {project.testimonials.title && (
                <h2 className="heading-secondary">{project.testimonials.title}</h2>
              )}
              {project.testimonials.subtitle && (
                <p>{project.testimonials.subtitle}</p>
              )}
              <ul style={{ paddingLeft: 20 }}>
                {project.testimonials.videos.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default PageContentPreview;
