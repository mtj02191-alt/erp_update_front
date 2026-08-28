const LazyImage = ({ src, alt = '', className = '', style, ...props }) => (
  <img src={src} alt={alt} className={className} style={style} {...props} />
);

export default LazyImage;
