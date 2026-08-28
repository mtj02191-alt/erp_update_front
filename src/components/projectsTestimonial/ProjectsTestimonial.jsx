const ProjectsTestimonial = ({ videos = [], title, subtitle }) => {
  if (!videos.length) return null;
  return (
    <section className="container py-48" style={{ padding: '24px 16px' }}>
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
      <ul>
        {videos.map((url, index) => (
          <li key={index}>
            <a href={url} target="_blank" rel="noreferrer">{url}</a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProjectsTestimonial;
